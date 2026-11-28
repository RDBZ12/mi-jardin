import { supabase } from '../supabase.js';
import { encolarOperacion, guardarCacheLocal, leerCacheLocal, obtenerColaPendiente } from './offline.js';
import { obtenerUsuarioDeSesion, sincronizarPendientes } from './sincronizador.js';
import { comprimirFoto } from '../utils/imagenes.js';

const BUCKET_FOTOS = 'fotos-plantas';
const urlsFotoLocal = new Map();

function errorDeRed(error) {
  return !navigator.onLine || error instanceof TypeError || /fetch|network|timeout/i.test(`${error?.name || ''} ${error?.message || ''}`);
}

export async function obtenerPlantas() {
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) return [];
  const cacheLocal = await leerCacheLocal(usuario.id, 'plantas');

  if (navigator.onLine && supabase) {
    try {
      const { data, error } = await supabase
        .from('plantas')
        .select('*')
        .order('creado_en', { ascending: false });
      if (error) throw error;

      const pendientes = (await obtenerColaPendiente(usuario.id))
        .filter((operacion) => operacion.tabla === 'plantas');
      const plantasRemotas = new Map(data.map((planta) => [planta.id, planta]));
      for (const operacion of pendientes) {
        if (operacion.accion === 'delete') {
          plantasRemotas.delete(operacion.payload.id);
        } else if (operacion.accion === 'upsert') {
          const local = operacion.payload;
          plantasRemotas.set(local.id, {
            ...plantasRemotas.get(local.id),
            ...local,
            foto_local_blob: operacion.archivoFoto || local.foto_local_blob,
          });
        }
      }

      const resultado = [...plantasRemotas.values()]
        .sort((a, b) => new Date(b.creado_en || 0) - new Date(a.creado_en || 0));
      await guardarCacheLocal(usuario.id, 'plantas', resultado);
      return resultado;
    } catch (error) {
      if (!errorDeRed(error)) throw error;
    }
  }

  return cacheLocal;
}

export async function guardarPlanta(planta, archivoFoto = null) {
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) throw new Error('Inicia sesión con internet antes de guardar plantas offline.');

  const id = planta.id || crypto.randomUUID();
  const actuales = await leerCacheLocal(usuario.id, 'plantas');
  const anterior = actuales.find((item) => item.id === id);
  const archivoOptimizado = archivoFoto ? await comprimirFoto(archivoFoto) : null;
  const archivoLocal = archivoOptimizado || anterior?.foto_local_blob || null;
  const extensionFoto = archivoOptimizado?.type === 'image/webp' ? 'webp' : 'jpg';
  const rutaFoto = archivoOptimizado
    ? `${usuario.id}/plantas/${id}.${extensionFoto}`
    : (planta.foto_ruta ?? anterior?.foto_ruta ?? null);
  const registroLocal = {
    ...planta,
    id,
    usuario_id: usuario.id,
    foto_ruta: rutaFoto,
    foto_local_blob: archivoLocal,
    creado_en: planta.creado_en || anterior?.creado_en || new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
    _offline: !navigator.onLine,
  };
  delete registroLocal.foto_url;

  await guardarCacheLocal(usuario.id, 'plantas', [
    registroLocal,
    ...actuales.filter((item) => item.id !== id),
  ]);
  await encolarOperacion(usuario.id, {
    tabla: 'plantas',
    accion: 'upsert',
    payload: registroLocal,
    archivoFoto: archivoOptimizado,
  });

  if (navigator.onLine) void sincronizarPendientes(usuario.id);
  return registroLocal;
}

export async function obtenerUrlFoto(plantaORuta, transform = null) {
  if (!plantaORuta) return null;
  if (typeof plantaORuta === 'object' && plantaORuta.foto_local_blob instanceof Blob) {
    const id = plantaORuta.id || plantaORuta.foto_ruta;
    const anterior = urlsFotoLocal.get(id);
    if (anterior?.blob === plantaORuta.foto_local_blob) return anterior.url;
    if (anterior) URL.revokeObjectURL(anterior.url);
    const url = URL.createObjectURL(plantaORuta.foto_local_blob);
    urlsFotoLocal.set(id, { blob: plantaORuta.foto_local_blob, url });
    return url;
  }

  const rutaStorage = typeof plantaORuta === 'string' ? plantaORuta : plantaORuta.foto_ruta;
  if (!rutaStorage) return null;
  if (rutaStorage.startsWith('http') || rutaStorage.startsWith('data:')) return rutaStorage;
  if (!navigator.onLine || !supabase) return null;

  const opciones = transform ? { transform } : undefined;
  const { data, error } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrl(rutaStorage, 3600, opciones);
  return error ? null : data?.signedUrl || null;
}

export function liberarUrlsFotoLocal() {
  for (const { url } of urlsFotoLocal.values()) URL.revokeObjectURL(url);
  urlsFotoLocal.clear();
}

export async function eliminarPlanta(id) {
  const usuario = await obtenerUsuarioDeSesion();
  if (!usuario) throw new Error('Inicia sesión con internet antes de eliminar plantas offline.');
  const actuales = await leerCacheLocal(usuario.id, 'plantas');
  const planta = actuales.find((item) => item.id === id);
  if (!planta) throw new Error('Planta no encontrada en este dispositivo.');

  await guardarCacheLocal(usuario.id, 'plantas', actuales.filter((item) => item.id !== id));
  await encolarOperacion(usuario.id, {
    tabla: 'plantas',
    accion: 'delete',
    payload: { id, foto_ruta: planta.foto_ruta || null },
  });
  if (navigator.onLine) void sincronizarPendientes(usuario.id);
}
