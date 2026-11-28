import { supabase } from '../supabase.js';
import { comprimirFoto } from '../utils/imagenes.js';
import { encolarOperacion, guardarCacheLocal, leerCacheLocal } from './offline.js';
import { esErrorDeRed, obtenerUsuarioDeSesion, sincronizarPendientes } from './sincronizador.js';

const TIPOS_CUIDADO = new Set([
  'riego',
  'fertilizacion',
  'poda',
  'trasplante',
  'limpieza',
  'control_plagas',
  'cambio_ubicacion',
  'revision',
  'otro',
]);

function errorDeRed(error) {
  return !navigator.onLine
    || error instanceof TypeError
    || /fetch|network|timeout/i.test(`${error?.name || ''} ${error?.message || ''}`);
}

function obtenerCliente() {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.');
  return supabase;
}

const ESTADOS_SALUD = new Set(['bien', 'regular', 'mal']);

// opciones.estadoSalud: 'bien' | 'regular' | 'mal'  ·  opciones.foto: File (opcional)
export async function registrarCuidado(plantaId, tipo = 'riego', notas = '', opciones = {}) {
  const cliente = obtenerCliente();
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) throw new Error('Inicia sesión con internet antes de guardar cuidados offline.');

  const tipoNormalizado = tipo === 'fertilizante' ? 'fertilizacion' : tipo;
  if (!TIPOS_CUIDADO.has(tipoNormalizado)) throw new Error('Tipo de cuidado no válido');

  const estadoSalud = opciones.estadoSalud || null;
  if (estadoSalud && !ESTADOS_SALUD.has(estadoSalud)) throw new Error('Estado de salud no válido');
  const foto = opciones.foto ? await comprimirFoto(opciones.foto) : null;

  const id = crypto.randomUUID();
  const extension = foto?.type === 'image/webp' ? 'webp' : 'jpg';
  const registro = {
    id,
    usuario_id: usuario.id,
    planta_id: plantaId,
    tipo: tipoNormalizado,
    observaciones: notas || null,
    fecha_hora: new Date().toISOString(),
    estado_salud: estadoSalud,
    foto_ruta: foto ? `${usuario.id}/cuidados/${id}.${extension}` : null,
    foto_local_blob: foto,
    _offline: !navigator.onLine,
  };
  const cacheCuidados = await leerCacheLocal(usuario.id, 'registros_cuidado');
  await guardarCacheLocal(usuario.id, 'registros_cuidado', [registro, ...cacheCuidados]);

  if (tipoNormalizado === 'riego') {
    const plantas = await leerCacheLocal(usuario.id, 'plantas');
    await guardarCacheLocal(usuario.id, 'plantas', plantas.map((planta) => (
      planta.id === plantaId ? { ...planta, ultimo_riego: registro.fecha_hora } : planta
    )));
  }

  if (estadoSalud) {
    // Refleja de inmediato el estado en la planta (el servidor lo recalcula al sincronizar).
    const plantas = await leerCacheLocal(usuario.id, 'plantas');
    await guardarCacheLocal(usuario.id, 'plantas', plantas.map((planta) => (
      planta.id === plantaId
        ? { ...planta, estado_salud: estadoSalud, ultima_revision: registro.fecha_hora }
        : planta
    )));
  }

  await encolarOperacion(usuario.id, {
    tabla: 'registros_cuidado',
    accion: 'upsert',
    payload: registro,
    archivoFoto: foto,
  });
  if (navigator.onLine) {
    let resultado = await sincronizarPendientes(usuario.id);
    // Si ya había una sincronización en curso, puede no haber incluido este registro.
    if (resultado.pendientes && navigator.onLine && !resultado.error) {
      resultado = await sincronizarPendientes(usuario.id);
    }
    if (resultado.error && !esErrorDeRed(resultado.error)) throw resultado.error;
  }

  return registro;
}

export async function importarRegistroCuidado(registro) {
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) throw new Error('Inicia sesión para restaurar cuidados.');
  if (!TIPOS_CUIDADO.has(registro?.tipo) || !registro.id || !registro.planta_id) {
    throw new Error('El registro de cuidado no es válido.');
  }

  const restaurado = { ...registro, usuario_id: usuario.id, _offline: !navigator.onLine };
  const cache = await leerCacheLocal(usuario.id, 'registros_cuidado');
  await guardarCacheLocal(usuario.id, 'registros_cuidado', [restaurado, ...cache.filter((item) => item.id !== restaurado.id)]);
  await encolarOperacion(usuario.id, { tabla: 'registros_cuidado', accion: 'upsert', payload: restaurado });
  if (navigator.onLine) void sincronizarPendientes(usuario.id);
  return restaurado;
}

export async function obtenerHistorialCuidados(plantaId = null) {
  const cliente = obtenerCliente();
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) return [];

  if (navigator.onLine) {
    let consulta = cliente
      .from('registros_cuidado')
      .select('*')
      .order('fecha_hora', { ascending: false });
    if (plantaId) consulta = consulta.eq('planta_id', plantaId);

    const { data, error } = await consulta;
    if (!error) {
      await guardarCacheLocal(usuario.id, 'registros_cuidado', data);
      return data;
    }
    if (!errorDeRed(error)) throw error;
  }

  const cache = await leerCacheLocal(usuario.id, 'registros_cuidado');
  return plantaId ? cache.filter((registro) => registro.planta_id === plantaId) : cache;
}
