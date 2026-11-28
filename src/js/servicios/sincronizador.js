import { supabase } from '../supabase.js';
import { eliminarDeCola, guardarCacheLocal, leerCacheLocal, obtenerColaPendiente } from './offline.js';

const CLAVE_USUARIO_OFFLINE = 'mi_jardin_usuario_offline';
let sincronizacionActual = null;

export function guardarSesionOffline(user) {
  if (!user?.id) return;
  const usuario = {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata || {},
  };
  try {
    localStorage.setItem(CLAVE_USUARIO_OFFLINE, JSON.stringify(usuario));
  } catch (error) {
    console.warn('No se pudo guardar el perfil local:', error);
  }
}

export function obtenerSesionOffline() {
  try {
    const raw = localStorage.getItem(CLAVE_USUARIO_OFFLINE);
    if (!raw) return null;
    const usuario = JSON.parse(raw);
    return typeof usuario?.id === 'string' ? usuario : null;
  } catch {
    return null;
  }
}

export function limpiarSesionOffline() {
  try {
    localStorage.removeItem(CLAVE_USUARIO_OFFLINE);
  } catch (error) {
    console.warn('No se pudo limpiar el perfil local:', error);
  }
}

export async function obtenerUsuarioDeSesion() {
  const usuarioOffline = obtenerSesionOffline();
  if (!supabase) return !navigator.onLine ? usuarioOffline : null;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.user) {
      guardarSesionOffline(data.session.user);
      return data.session.user;
    }
    if (!navigator.onLine) return usuarioOffline;
    return error && esErrorDeRed(error) ? usuarioOffline : null;
  } catch (error) {
    return esErrorDeRed(error) ? usuarioOffline : null;
  }
}

export function esErrorDeRed(error) {
  return !navigator.onLine
    || error instanceof TypeError
    || /fetch|network|timeout/i.test(`${error?.name || ''} ${error?.message || ''}`);
}

function quitarCamposLocales(payload) {
  const limpio = { ...payload };
  delete limpio._offline;
  delete limpio._local_actualizado;
  delete limpio.foto_local_blob;
  delete limpio.foto_local_url;
  delete limpio.especie;
  return limpio;
}

async function subirFotoPlanta(usuarioId, operacion, payload) {
  const archivo = operacion.archivoFoto;
  if (!archivo) return payload.foto_ruta || null;
  if (typeof archivo.size !== 'number' || archivo.size <= 0) {
    throw new Error('La imagen no contiene datos. Selecciona la foto nuevamente.');
  }

  const extension = archivo.name?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'jpg';
  const ruta = payload.foto_ruta || `${usuarioId}/${payload.id}.${extension}`;
  const { error } = await supabase.storage
    .from('fotos-plantas')
    .upload(ruta, archivo, { upsert: true, contentType: archivo.type || undefined });
  if (error) throw error;
  return ruta;
}

async function sincronizarOperacion(usuarioId, operacion) {
  const payload = operacion.payload || {};

  if (operacion.tabla === 'plantas' && operacion.accion === 'upsert') {
    const fotoRuta = await subirFotoPlanta(usuarioId, operacion, payload);
    const datos = quitarCamposLocales({ ...payload, usuario_id: usuarioId, foto_ruta: fotoRuta });
    // Los calcula la base de datos a partir del historial; no se deben pisar desde la caché.
    delete datos.estado_salud;
    delete datos.ultima_revision;
    const { data, error } = await supabase
      .from('plantas')
      .upsert(datos)
      .select()
      .single();
    if (error) throw error;

    const cache = await leerCacheLocal(usuarioId, 'plantas');
    await guardarCacheLocal(usuarioId, 'plantas', cache.map((planta) => (
      planta.id === data.id ? { ...data, foto_local_blob: planta.foto_local_blob } : planta
    )));
    return;
  }

  if (operacion.tabla === 'plantas' && operacion.accion === 'delete') {
    const { error } = await supabase
      .from('plantas')
      .delete()
      .eq('id', payload.id)
      .eq('usuario_id', usuarioId);
    if (error) throw error;
    if (payload.foto_ruta) {
      const { error: errorFoto } = await supabase.storage
        .from('fotos-plantas')
        .remove([payload.foto_ruta]);
      if (errorFoto) throw errorFoto;
    }
    return;
  }

  if (operacion.tabla === 'registros_cuidado' && operacion.accion === 'upsert') {
    const fotoRuta = await subirFotoPlanta(usuarioId, operacion, payload);
    const { error } = await supabase
      .from('registros_cuidado')
      .upsert(quitarCamposLocales({ ...payload, usuario_id: usuarioId, foto_ruta: fotoRuta }));
    if (error) throw error;
    return;
  }

  if (operacion.tabla === 'recordatorios' && operacion.accion === 'upsert') {
    const { error } = await supabase
      .from('recordatorios')
      .upsert(quitarCamposLocales({ ...payload, usuario_id: usuarioId }));
    if (error) throw error;
    return;
  }

  if (operacion.accion === 'rpc_completar_recordatorio') {
    const { data: actual, error: errorLectura } = await supabase
      .from('recordatorios')
      .select('estado, fecha_hora')
      .eq('id', payload.id)
      .maybeSingle();
    if (errorLectura) throw errorLectura;

    const yaCambio = !actual
      || actual.estado !== 'pendiente'
      || new Date(actual.fecha_hora).getTime() !== new Date(payload.fecha_hora_original).getTime();
    if (yaCambio) return;

    const { error } = await supabase.rpc('completar_recordatorio', {
      p_recordatorio_id: payload.id,
    });
    if (error) throw error;
    return;
  }

  throw new Error(`Operación offline desconocida: ${operacion.tabla}/${operacion.accion}`);
}

export async function sincronizarPendientes(usuarioId, onProgreso = null) {
  if (!navigator.onLine || !usuarioId || !supabase) return { procesadas: 0, pendientes: 0 };
  if (sincronizacionActual) return sincronizacionActual;

  sincronizacionActual = (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || data.session?.user?.id !== usuarioId) {
      return { procesadas: 0, pendientes: (await obtenerColaPendiente(usuarioId)).length };
    }

    const pendientes = await obtenerColaPendiente(usuarioId);
    let procesadas = 0;
    let ultimoError = null;
    for (const operacion of pendientes) {
      try {
        if (!navigator.onLine) break;
        await sincronizarOperacion(usuarioId, operacion);
        await eliminarDeCola(operacion.id);
        procesadas += 1;
      } catch (errorOperacion) {
        ultimoError = errorOperacion;
        if (!esErrorDeRed(errorOperacion)) {
          console.error('No se pudo sincronizar una operación:', errorOperacion);
        }
        break;
      }
    }

    const restantes = (await obtenerColaPendiente(usuarioId)).length;
    if (procesadas && onProgreso) await onProgreso();
    return { procesadas, pendientes: restantes, error: ultimoError };
  })().finally(() => {
    sincronizacionActual = null;
  });

  return sincronizacionActual;
}
