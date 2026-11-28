import test from 'node:test';
import assert from 'node:assert/strict';
import { arreglarTexto, normalizarProducto, formatearPrecio, buscarProductos } from '../src/js/servicios/catalogo.js';

test('arreglarTexto revierte la doble codificación UTF-8 del servidor', () => {
  assert.equal(arreglarTexto('TelÃ©fono inteligente Samsung ClÃ¡sico'), 'Teléfono inteligente Samsung Clásico');
  assert.equal(arreglarTexto('EdiciÃ³n pequeÃ±a'), 'Edición pequeña');
});

test('arreglarTexto no toca texto que ya está bien ni valores no textuales', () => {
  assert.equal(arreglarTexto('Teléfono Samsung'), 'Teléfono Samsung');
  assert.equal(arreglarTexto('Tecnologia'), 'Tecnologia');
  assert.equal(arreglarTexto(null), null);
  assert.equal(arreglarTexto(12), 12);
  assert.equal(arreglarTexto('Ã€ solo'), 'Ã€ solo'); // no es latin1 válido → se deja igual
});

const crudo = {
  id: 1, nombre: 'TelÃ©fono', nombre_comercial: 'TelÃ©fono inteligente Samsung', descripcion: 'Ficha simulada para prÃ¡cticas',
  imagen: 'https://loremflickr.com/640/480/smartphone?lock=1001', imagen_respaldo: 'https://placehold.co/640x480/png',
  marca: 'Samsung', modelo: 'SAM-0101', categoria: 'Tecnologia', tipo: 'TelÃ©fono inteligente',
  costo: 6297.6, precio: 9840, existencia: 29, disponible: true, moneda: 'DOP',
};

test('normalizarProducto limpia textos, descarta el costo y conserva lo mostrable', () => {
  const p = normalizarProducto(crudo);
  assert.equal(p.nombre, 'Teléfono inteligente Samsung');
  assert.equal(p.descripcion, 'Ficha simulada para prácticas');
  assert.equal(p.precio, 9840);
  assert.equal(p.disponible, true);
  assert.equal('costo' in p, false);
});

test('normalizarProducto: sin existencia no está disponible; imágenes http se descartan', () => {
  const p = normalizarProducto({ ...crudo, existencia: 0, imagen: 'http://x.com/a.jpg', moneda: 'xx' });
  assert.equal(p.disponible, false);
  assert.equal(p.imagen, '');
  assert.equal(p.moneda, 'DOP');
});

test('formatearPrecio usa la moneda del producto', () => {
  assert.match(formatearPrecio(9840, 'DOP', 'es'), /9[.,\s]?840/);
  assert.equal(formatearPrecio(null, 'DOP', 'es'), '');
});

test('buscarProductos codifica la consulta y valida la respuesta', async () => {
  let urlPedida = '';
  globalThis.fetch = async (url) => { urlPedida = url; return { ok: true, json: async () => ({ estado: 'ok', total_catalogo: 400, total_resultados: 1, productos: [crudo] }) }; };
  const r = await buscarProductos(' cámara & lente ');
  assert.equal(urlPedida, 'https://softecard.net/productos.php?consulta=c%C3%A1mara%20%26%20lente');
  assert.equal(r.total, 1);
  assert.equal(r.productos[0].marca, 'Samsung');

  globalThis.fetch = async () => ({ ok: true, json: async () => ({ estado: 'error' }) });
  await assert.rejects(() => buscarProductos('a'));
  globalThis.fetch = async () => ({ ok: false, status: 500 });
  await assert.rejects(() => buscarProductos('a'), /500/);
});

import { paginar } from '../src/js/servicios/catalogo.js';

test('paginar: 100 resultados en páginas de 12', () => {
  const todos = Array.from({ length: 100 }, (_, i) => i + 1);
  const p1 = paginar(todos, 1);
  assert.deepEqual([p1.items.length, p1.paginas, p1.desde, p1.hasta, p1.total], [12, 9, 1, 12, 100]);
  const ultima = paginar(todos, 9);
  assert.deepEqual([ultima.items.length, ultima.desde, ultima.hasta], [4, 97, 100]);
  assert.equal(ultima.items.at(-1), 100);
});

test('paginar: página fuera de rango se ajusta y lista vacía es segura', () => {
  const todos = [1, 2, 3];
  assert.equal(paginar(todos, 99).pagina, 1);
  assert.equal(paginar(todos, -5).pagina, 1);
  assert.equal(paginar(todos, 'x').pagina, 1);
  const vacio = paginar([], 1);
  assert.deepEqual([vacio.items.length, vacio.paginas, vacio.desde, vacio.hasta], [0, 1, 0, 0]);
});

test('la imagen de respaldo también se corrige (el texto va dentro de la URL)', () => {
  const p = normalizarProducto({ ...crudo, imagen_respaldo: 'https://placehold.co/640x480/e8edf2/344054/png?text=Tel%C3%83%C2%A9fono%20inteligente' });
  assert.equal(new URL(p.imagenRespaldo).searchParams.get('text'), 'Teléfono inteligente');
  assert.equal(p.imagenRespaldo.startsWith('https://placehold.co/640x480/e8edf2/344054/png?text=Tel'), true);
});
