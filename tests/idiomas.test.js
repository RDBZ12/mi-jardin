import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.document = { documentElement: {}, querySelector: () => null, querySelectorAll: () => [] };
const { textoApp, traduccionSalud, traduccionTipo } = await import('../src/js/utils/idiomas.js');

const CLAVES_MONITOREO = [
  'healthGood', 'healthFair', 'healthBad', 'healthLabel', 'notReviewed', 'review', 'reviewPlant', 'howIsPlant',
  'reviewNote', 'reviewNotePlaceholder', 'reviewPhoto', 'saveReview', 'reviewSaved', 'chooseHealth', 'reviewSaveError',
  'timelineTitle', 'noTimeline', 'loadingTimeline', 'lastReview', 'needsAttention', 'allGood', 'attentionCount', 'attentionOne',
  'reasonOverdue', 'reasonBad', 'reasonFair', 'reasonStale', 'reasonNever', 'weekTitle', 'weekSummary', 'reviewNow',
];

test('las claves del monitoreo existen en español e inglés', () => {
  for (const clave of CLAVES_MONITOREO) {
    assert.ok(textoApp.es[clave], `falta es.${clave}`);
    assert.ok(textoApp.en[clave], `falta en.${clave}`);
  }
});

test('todo tApp("...") usado en el código nuevo existe en ambos idiomas', () => {
  const archivos = ['componentes/seguimientoSalud.js', 'paginas/inicio.js', 'paginas/plantas.js', 'paginas/historial.js', 'paginas/catalogo.js'];
  for (const archivo of archivos) {
    const fuente = readFileSync(new URL(`../src/js/${archivo}`, import.meta.url), 'utf8');
    for (const [, clave] of [...fuente.matchAll(/tApp\('([A-Za-z]+)'/g), ...fuente.matchAll(/data-t="([A-Za-z]+)"/g)]) {
      assert.ok(textoApp.es[clave], `${archivo}: falta es.${clave}`);
      assert.ok(textoApp.en[clave], `${archivo}: falta en.${clave}`);
    }
  }
});

test('traducciones de salud y tipo "revision"', () => {
  assert.equal(traduccionSalud('mal'), 'Mal');
  assert.equal(traduccionSalud(null), 'Sin revisar');
  assert.equal(traduccionTipo('revision'), 'Revisión');
});
