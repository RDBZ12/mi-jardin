// Lógica pura del monitoreo (sin DOM ni red) para poder probarla fácilmente.
import { fechaProximoRiego } from './fechas.js';

export const ESTADOS_SALUD = ['bien', 'regular', 'mal'];
export const DIAS_SIN_REVISAR = 14;
const MS_DIA = 86400000;

function inicioDelDia(fecha) {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

// Devuelve el nivel de atención de una planta y los motivos (clave i18n + parámetros).
//   nivel: 'ok' | 'atencion' | 'urgente'
export function evaluarAtencion(planta, ahora = new Date()) {
  const hoy = inicioDelDia(ahora);
  const motivos = [];
  let puntos = 0;

  const diasAtraso = Math.round((hoy - fechaProximoRiego(planta)) / MS_DIA);
  if (diasAtraso >= 1) {
    motivos.push({ clave: 'reasonOverdue', valores: { days: diasAtraso } });
    puntos = Math.max(puntos, diasAtraso >= 3 ? 2 : 1);
  }

  if (planta.estado_salud === 'mal') {
    motivos.push({ clave: 'reasonBad', valores: {} });
    puntos = 2;
  } else if (planta.estado_salud === 'regular') {
    motivos.push({ clave: 'reasonFair', valores: {} });
    puntos = Math.max(puntos, 1);
  }

  const baseRevision = planta.ultima_revision || planta.creado_en;
  if (baseRevision) {
    const diasSinRevisar = Math.floor((hoy - inicioDelDia(baseRevision)) / MS_DIA);
    if (diasSinRevisar >= DIAS_SIN_REVISAR) {
      motivos.push(planta.ultima_revision
        ? { clave: 'reasonStale', valores: { days: diasSinRevisar } }
        : { clave: 'reasonNever', valores: {} });
      puntos = Math.max(puntos, 1);
    }
  }

  return { nivel: ['ok', 'atencion', 'urgente'][puntos], puntos, motivos, diasAtraso };
}

// Plantas que necesitan atención, las más urgentes primero.
export function plantasConAtencion(plantas, ahora = new Date()) {
  return plantas
    .map((planta) => ({ planta, ...evaluarAtencion(planta, ahora) }))
    .filter((item) => item.nivel !== 'ok')
    .sort((a, b) => b.puntos - a.puntos || b.diasAtraso - a.diasAtraso);
}

// Resumen de los últimos 7 días a partir del historial de cuidados.
export function resumenSemana(registros, ahora = new Date()) {
  const desde = ahora.getTime() - 7 * MS_DIA;
  const recientes = registros.filter((r) => new Date(r.fecha_hora).getTime() >= desde);
  return {
    riegos: recientes.filter((r) => r.tipo === 'riego').length,
    revisiones: recientes.filter((r) => r.estado_salud).length,
    otros: recientes.filter((r) => r.tipo !== 'riego' && !r.estado_salud).length,
  };
}

// Cifras para el panel de Inicio.
export function metricasJardin(plantas, ahora = new Date()) {
  const hoy = inicioDelDia(ahora);
  const distribucion = { bien: 0, regular: 0, mal: 0, sin: 0 };
  let porRegar = 0;
  let sinRevisar = 0;
  let urgentes = 0;
  let proximoRiego = null;

  for (const planta of plantas) {
    distribucion[ESTADOS_SALUD.includes(planta.estado_salud) ? planta.estado_salud : 'sin'] += 1;
    const proximo = fechaProximoRiego(planta);
    if (!proximoRiego || proximo < proximoRiego) proximoRiego = proximo;
    if (proximo <= hoy) porRegar += 1;
    const atencion = evaluarAtencion(planta, ahora);
    if (atencion.nivel === 'urgente') urgentes += 1;
    if (atencion.motivos.some((m) => m.clave === 'reasonStale' || m.clave === 'reasonNever')) sinRevisar += 1;
  }

  const revisadas = distribucion.bien + distribucion.regular + distribucion.mal;
  return {
    total: plantas.length,
    porRegar,
    atencion: plantasConAtencion(plantas, ahora).length,
    urgentes,
    sinRevisar,
    distribucion,
    revisadas,
    porcentajeSano: revisadas ? Math.round((distribucion.bien / revisadas) * 100) : null,
    proximoRiego,
  };
}

// Riegos y revisiones por día de los últimos 7 días (el último elemento es hoy).
export function actividadSemanal(registros, ahora = new Date()) {
  const hoy = inicioDelDia(ahora);
  const dias = [];
  for (let i = 6; i >= 0; i -= 1) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    dias.push({ fecha, riegos: 0, revisiones: 0 });
  }
  for (const registro of registros) {
    const dia = inicioDelDia(registro.fecha_hora);
    const indice = Math.round((dia - dias[0].fecha) / MS_DIA);
    if (indice < 0 || indice > 6) continue;
    if (registro.tipo === 'riego') dias[indice].riegos += 1;
    if (registro.estado_salud) dias[indice].revisiones += 1;
  }
  return dias;
}
