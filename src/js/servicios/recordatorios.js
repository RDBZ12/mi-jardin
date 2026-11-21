import { supabase } from '../supabase.js';
import { encolarOperacion, guardarCacheLocal, leerCacheLocal, obtenerColaPendiente } from './offline.js';
import { obtenerUsuarioDeSesion, sincronizarPendientes } from './sincronizador.js';

function obtenerCliente() {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.');
  return supabase;
}

function errorDeRed(error) {
  return !navigator.onLine
    || error instanceof TypeError
    || /fetch|network|timeout/i.test(`${error?.name || ''} ${error?.message || ''}`);
}

function asociarPlanta(recordatorios, plantas) {
  const porId = new Map(plantas.map((planta) => [planta.id, planta]));
  return recordatorios.map((recordatorio) => ({
    ...recordatorio,
    plantas: porId.get(recordatorio.planta_id) || recordatorio.plantas || null,
  }));
}

export async function obtenerRecordatoriosPendientes() {
  const cliente = obtenerCliente();
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) return [];
  const cache = await leerCacheLocal(usuario.id, 'recordatorios');

  if (navigator.onLine && supabase) {
    try {
      const { data, error } = await supabase
        .from('recordatorios')
        .select('*, plantas!recordatorios_planta_fk(id, nombre, nombre_cientifico, foto_ruta)')
        .eq('estado', 'pendiente')
        .order('fecha_hora', { ascending: true });
      if (error) throw error;

      const pendientes = (await obtenerColaPendiente(usuario.id))
        .filter((operacion) => operacion.tabla === 'recordatorios');
      const recordatorios = new Map(data.map((item) => [item.id, item]));
      for (const operacion of pendientes) {
        if (operacion.accion === 'upsert') {
          recordatorios.set(operacion.payload.id, operacion.payload);
        } else if (operacion.accion === 'rpc_completar_recordatorio') {
          const local = operacion.payload.actualizacion_local;
          if (local?.estado === 'completado') recordatorios.delete(local.id);
          else if (local) recordatorios.set(local.id, local);
        }
      }

      const ordenados = [...recordatorios.values()]
        .filter((item) => item.estado === 'pendiente')
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      await guardarCacheLocal(usuario.id, 'recordatorios', ordenados);
      const plantas = await leerCacheLocal(usuario.id, 'plantas');
      return asociarPlanta(ordenados, plantas);
    } catch (error) {
      if (!errorDeRed(error)) throw error;
    }
  }

  const plantas = await leerCacheLocal(usuario.id, 'plantas');
  return asociarPlanta(cache.filter((item) => item.estado === 'pendiente'), plantas)
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
}

export async function guardarRecordatorio(recordatorio) {
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) throw new Error('Inicia sesión con internet antes de crear recordatorios offline.');

  const nuevo = {
    ...recordatorio,
    id: recordatorio.id || crypto.randomUUID(),
    usuario_id: usuario.id,
    estado: 'pendiente',
    creado_en: new Date().toISOString(),
    _offline: !navigator.onLine,
  };
  const cache = await leerCacheLocal(usuario.id, 'recordatorios');
  await guardarCacheLocal(usuario.id, 'recordatorios', [nuevo, ...cache.filter((item) => item.id !== nuevo.id)]);
  await encolarOperacion(usuario.id, {
    tabla: 'recordatorios',
    accion: 'upsert',
    payload: nuevo,
  });
  if (navigator.onLine) void sincronizarPendientes(usuario.id);
  return nuevo;
}

export async function importarRecordatorio(recordatorio) {
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) throw new Error('Inicia sesión para restaurar recordatorios.');
  if (!recordatorio?.id || !recordatorio.planta_id || !recordatorio.fecha_hora || !recordatorio.tipo_cuidado) {
    throw new Error('El recordatorio no es válido.');
  }

  const { plantas: _plantas, usuario_id: _usuarioOriginal, ...datos } = recordatorio;
  const restaurado = { ...datos, usuario_id: usuario.id, _offline: !navigator.onLine };
  const cache = await leerCacheLocal(usuario.id, 'recordatorios');
  await guardarCacheLocal(usuario.id, 'recordatorios', [restaurado, ...cache.filter((item) => item.id !== restaurado.id)]);
  await encolarOperacion(usuario.id, { tabla: 'recordatorios', accion: 'upsert', payload: restaurado });
  if (navigator.onLine) void sincronizarPendientes(usuario.id);
  return restaurado;
}

export async function completarRecordatorio(recordatorioId) {
  const cliente = obtenerCliente();
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) throw new Error('Inicia sesión con internet para completar recordatorios.');
  let cache = await leerCacheLocal(usuario.id, 'recordatorios');
  let recordatorio = cache.find((item) => item.id === recordatorioId);

  if (!recordatorio && navigator.onLine) {
    const { data, error } = await cliente
      .from('recordatorios')
      .select('*')
      .eq('id', recordatorioId)
      .maybeSingle();
    if (error) throw error;
    recordatorio = data;
  }
  if (!recordatorio || recordatorio.estado !== 'pendiente') {
    throw new Error('El recordatorio ya no está pendiente o no está disponible offline.');
  }

  const fechaOriginal = recordatorio.fecha_hora;
  const ahora = new Date();
  let actualizado;
  if (recordatorio.repeticion === 'ninguna') {
    actualizado = { ...recordatorio, estado: 'completado', completado_en: ahora.toISOString() };
  } else {
    const pasoDias = { diaria: 1, semanal: 7, quincenal: 14 }[recordatorio.repeticion];
    let siguiente = new Date(fechaOriginal);
    if (recordatorio.repeticion === 'mensual') siguiente.setMonth(siguiente.getMonth() + 1);
    else siguiente.setDate(siguiente.getDate() + (pasoDias || 7));
    while (siguiente <= ahora) {
      if (recordatorio.repeticion === 'mensual') siguiente.setMonth(siguiente.getMonth() + 1);
      else siguiente.setDate(siguiente.getDate() + (pasoDias || 7));
    }
    actualizado = { ...recordatorio, fecha_hora: siguiente.toISOString(), completado_en: ahora.toISOString() };
  }

  cache = [actualizado, ...cache.filter((item) => item.id !== recordatorioId)];
  await guardarCacheLocal(usuario.id, 'recordatorios', cache);
  await encolarOperacion(usuario.id, {
    tabla: 'recordatorios',
    accion: 'rpc_completar_recordatorio',
    payload: {
      id: recordatorioId,
      fecha_hora_original: fechaOriginal,
      actualizacion_local: actualizado,
    },
  });
  if (navigator.onLine) void sincronizarPendientes(usuario.id);

  return actualizado;
}
