import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularDimensiones, comprimirFoto, MAX_BYTES_FOTO, MAX_DIMENSION_FOTO } from '../src/js/utils/imagenes.js';

test('reduce una foto grande conservando su proporción', () => {
  assert.deepEqual(calcularDimensiones(4000, 3000), { ancho: 1280, alto: 960 });
});

test('no amplía fotos pequeñas', () => {
  assert.deepEqual(calcularDimensiones(640, 480), { ancho: 640, alto: 480 });
});

test('las constantes mantienen un límite razonable para Storage', () => {
  assert.equal(MAX_DIMENSION_FOTO, 1280);
  assert.equal(MAX_BYTES_FOTO, 614400);
});

test('rechaza dimensiones inválidas', () => {
  assert.throws(() => calcularDimensiones(0, 100), /dimensiones válidas/);
});

test('comprime la foto y la entrega como WebP', async () => {
  const documentOriginal = globalThis.document;
  const bitmapOriginal = globalThis.createImageBitmap;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob(callback, tipo) {
      callback(new Blob([new Uint8Array(10)], { type: tipo }));
    },
  };
  globalThis.createImageBitmap = async () => ({ width: 4000, height: 3000, close() {} });
  globalThis.document = { createElement: () => canvas };

  try {
    const resultado = await comprimirFoto(new Blob(['foto'], { type: 'image/jpeg' }));
    assert.equal(resultado.type, 'image/webp');
    assert.ok(resultado.size > 0);
    assert.equal(canvas.width, 1280);
    assert.equal(canvas.height, 960);
  } finally {
    globalThis.document = documentOriginal;
    globalThis.createImageBitmap = bitmapOriginal;
  }
});
