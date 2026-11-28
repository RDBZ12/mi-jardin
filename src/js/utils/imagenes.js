export const MAX_DIMENSION_FOTO = 1280;
export const MAX_BYTES_FOTO = 600 * 1024;

export function calcularDimensiones(ancho, alto, maxDimension = MAX_DIMENSION_FOTO) {
  if (!Number.isFinite(ancho) || !Number.isFinite(alto) || ancho <= 0 || alto <= 0) {
    throw new Error('La imagen no tiene dimensiones válidas.');
  }

  const escala = Math.min(1, maxDimension / Math.max(ancho, alto));
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  };
}

function abrirImagen(archivo) {
  if (globalThis.createImageBitmap) return globalThis.createImageBitmap(archivo);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagen);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    imagen.src = url;
  });
}

function convertirABlob(canvas, tipo, calidad) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('El navegador no pudo comprimir la imagen.'));
    }, tipo, calidad);
  });
}

export async function comprimirFoto(archivo, {
  maxDimension = MAX_DIMENSION_FOTO,
  maxBytes = MAX_BYTES_FOTO,
} = {}) {
  if (!(archivo instanceof Blob) || !archivo.type.startsWith('image/')) {
    throw new Error('Selecciona una imagen válida.');
  }

  const imagen = await abrirImagen(archivo);
  const dimensiones = calcularDimensiones(imagen.width, imagen.height, maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = dimensiones.ancho;
  canvas.height = dimensiones.alto;
  const contexto = canvas.getContext('2d', { alpha: false });
  if (!contexto) throw new Error('El navegador no pudo preparar la imagen.');
  contexto.drawImage(imagen, 0, 0, dimensiones.ancho, dimensiones.alto);
  imagen.close?.();

  let blob = null;
  for (const calidad of [0.82, 0.72, 0.62, 0.52]) {
    blob = await convertirABlob(canvas, 'image/webp', calidad);
    if (blob.size <= maxBytes) break;
  }

  // Algunos navegadores antiguos ignoran image/webp y devuelven PNG.
  if (!blob || blob.type !== 'image/webp') {
    blob = await convertirABlob(canvas, 'image/jpeg', 0.78);
  }

  const tipo = blob.type || 'image/webp';
  return new Blob([blob], { type: tipo });
}
