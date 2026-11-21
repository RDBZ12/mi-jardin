import { supabase } from '../supabase.js';
import { encolarOperacion, guardarCacheLocal, leerCacheLocal } from './offline.js';
import { obtenerUsuarioDeSesion, sincronizarPendientes } from './sincronizador.js';

const TIPOS_CUIDADO = new Set([
  'riego',
  'fertilizacion',
  'poda',
  'trasplante',
  'limpieza',
  'control_plagas',
  'cambio_ubicacion',
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

export async function registrarCuidado(plantaId, tipo = 'riego', notas = '') {
  const cliente = obtenerCliente();
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) throw new Error('Inicia sesión con internet antes de guardar cuidados offline.');

  const tipoNormalizado = tipo === 'fertilizante' ? 'fertilizacion' : tipo;
  if (!TIPOS_CUIDADO.has(tipoNormalizado)) throw new Error('Tipo de cuidado no válido');

  const registro = {
    id: crypto.randomUUID(),
    usuario_id: usuario.id,
    planta_id: plantaId,
    tipo: tipoNormalizado,
    observaciones: notas || null,
    fecha_hora: new Date().toISOString(),
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

  await encolarOperacion(usuario.id, {
    tabla: 'registros_cuidado',
    accion: 'upsert',
    payload: registro,
  });
  if (navigator.onLine) void sincronizarPendientes(usuario.id);

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
