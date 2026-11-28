import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarEspeciePorNombre, catalogoEspecies } from '../src/js/datos/catalogoEspecies.js';

test('el catálogo contiene especies con frecuencia de riego', () => {
  assert.ok(catalogoEspecies.length >= 10);
  assert.ok(catalogoEspecies.every((especie) => especie.cientifico && especie.riego > 0));
});

test('encuentra una especie por nombre científico', () => {
  assert.deepEqual(buscarEspeciePorNombre('Monstera deliciosa'), {
    nombre: 'Monstera', cientifico: 'Monstera deliciosa', categoria: 'interior', riego: 7,
  });
  assert.equal(buscarEspeciePorNombre('Monstera'), null);
});
