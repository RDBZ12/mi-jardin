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
