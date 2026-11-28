import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluarAtencion, plantasConAtencion, resumenSemana } from '../src/js/utils/salud.js';

const ahora = new Date(2026, 10, 21, 10, 0, 0); // 21 nov 2026
const dia = (n) => new Date(2026, 10, 21 - n, 9, 0, 0).toISOString();
const base = { frecuencia_riego_dias: 7, creado_en: dia(1) };

test('planta al día y revisada: sin atención', () => {
  const r = evaluarAtencion({ ...base, ultimo_riego: dia(2), estado_salud: 'bien', ultima_revision: dia(2) }, ahora);
  assert.equal(r.nivel, 'ok');
  assert.deepEqual(r.motivos, []);
});

test('riego atrasado 1-2 días: atención; 3+: urgente', () => {
  const uno = evaluarAtencion({ ...base, ultimo_riego: dia(8), ultima_revision: dia(1) }, ahora);
  assert.equal(uno.nivel, 'atencion');
  assert.equal(uno.motivos[0].valores.days, 1);
  const tres = evaluarAtencion({ ...base, ultimo_riego: dia(10), ultima_revision: dia(1) }, ahora);
  assert.equal(tres.nivel, 'urgente');
});

test('toca regar hoy no cuenta como atraso', () => {
  const r = evaluarAtencion({ ...base, ultimo_riego: dia(7), ultima_revision: dia(1) }, ahora);
  assert.equal(r.nivel, 'ok');
});

test('estado mal = urgente, regular = atención', () => {
  const mal = evaluarAtencion({ ...base, ultimo_riego: dia(1), estado_salud: 'mal', ultima_revision: dia(1) }, ahora);
  assert.equal(mal.nivel, 'urgente');
  const reg = evaluarAtencion({ ...base, ultimo_riego: dia(1), estado_salud: 'regular', ultima_revision: dia(1) }, ahora);
  assert.equal(reg.nivel, 'atencion');
});

test('sin revisar 14+ días (o nunca, creada hace 14+)', () => {
  const vieja = evaluarAtencion({ ...base, ultimo_riego: dia(1), ultima_revision: dia(15) }, ahora);
  assert.equal(vieja.nivel, 'atencion');
  assert.equal(vieja.motivos[0].clave, 'reasonStale');
  const nunca = evaluarAtencion({ ...base, creado_en: dia(20), ultimo_riego: dia(1) }, ahora);
  assert.equal(nunca.motivos[0].clave, 'reasonNever');
  const nueva = evaluarAtencion({ ...base, ultimo_riego: dia(1) }, ahora);
  assert.equal(nueva.nivel, 'ok');
});

test('plantasConAtencion ordena por urgencia y omite las sanas', () => {
  const lista = plantasConAtencion([
    { id: 'a', ...base, ultimo_riego: dia(1), ultima_revision: dia(1) },
    { id: 'b', ...base, ultimo_riego: dia(8), ultima_revision: dia(1) },
    { id: 'c', ...base, ultimo_riego: dia(1), estado_salud: 'mal', ultima_revision: dia(1) },
  ], ahora);
  assert.deepEqual(lista.map((i) => i.planta.id), ['c', 'b']);
});

test('resumenSemana cuenta solo los últimos 7 días', () => {
  const r = resumenSemana([
    { tipo: 'riego', fecha_hora: dia(1) },
    { tipo: 'riego', fecha_hora: dia(9) },
    { tipo: 'revision', estado_salud: 'bien', fecha_hora: dia(2) },
    { tipo: 'poda', fecha_hora: dia(3) },
  ], ahora);
  assert.deepEqual(r, { riegos: 1, revisiones: 1, otros: 1 });
});

import { metricasJardin, actividadSemanal } from '../src/js/utils/salud.js';

test('metricasJardin: totales, distribución y porcentaje sano', () => {
  const m = metricasJardin([
    { ...base, ultimo_riego: dia(8), estado_salud: 'bien', ultima_revision: dia(1) },   // riego atrasado
    { ...base, ultimo_riego: dia(1), estado_salud: 'bien', ultima_revision: dia(1) },
    { ...base, ultimo_riego: dia(1), estado_salud: 'mal', ultima_revision: dia(1) },    // urgente
    { ...base, ultimo_riego: dia(1) },                                                  // sin revisar, pero nueva
  ], ahora);
  assert.equal(m.total, 4);
  assert.equal(m.porRegar, 1);
  assert.equal(m.urgentes, 1);
  assert.equal(m.atencion, 2);
  assert.deepEqual(m.distribucion, { bien: 2, regular: 0, mal: 1, sin: 1 });
  assert.equal(m.revisadas, 3);
  assert.equal(m.porcentajeSano, 67);
});

test('metricasJardin sin plantas', () => {
  const m = metricasJardin([], ahora);
  assert.equal(m.total, 0);
  assert.equal(m.porcentajeSano, null);
  assert.equal(m.proximoRiego, null);
});

test('actividadSemanal agrupa por día y descarta lo antiguo', () => {
  const dias = actividadSemanal([
    { tipo: 'riego', fecha_hora: dia(0) },
    { tipo: 'riego', fecha_hora: dia(0) },
    { tipo: 'revision', estado_salud: 'bien', fecha_hora: dia(3) },
    { tipo: 'riego', fecha_hora: dia(6) },
    { tipo: 'riego', fecha_hora: dia(7) },
  ], ahora);
  assert.equal(dias.length, 7);
  assert.equal(dias[6].riegos, 2);
  assert.equal(dias[3].revisiones, 1);
  assert.equal(dias[0].riegos, 1);
  assert.equal(dias.reduce((n, d) => n + d.riegos, 0), 3);
});
