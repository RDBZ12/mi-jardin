// Reduce el peso de las fotos antes de subirlas a Supabase Storage.
// Redimensiona (máx. maxLado px), respeta la rotación EXIF y recodifica en WebP;
// donde el navegador no sabe codificar WebP (Safari), usa JPEG.

export const OPCIONES_FOTO = Object.freeze({ maxLado: 1280, calidad: 0.8 });

// Escala para que el lado mayor no pase de maxLado (nunca agranda).
export function calcularDimensiones(ancho, alto, maxLado) {
  const mayor = Math.max(ancho, alto);
  if (!mayor || mayor <= maxLado) return { ancho, alto };
  const escala = maxLado / mayor;
  return { ancho: Math.max(1, Math.round(ancho * escala)), alto: Math.max(1, Math.round(alto * escala)) };
}

function nombreSinExtension(nombre = 'foto') {
  return nombre.replace(/\.[^./\\]+$/, '') || 'foto';
}

function aBlob(canvas, tipo, calidad) {
  return new Promise((resolver) => canvas.toBlob((blob) => resolver(blob), tipo, calidad));
}

// Devuelve un File más liviano; si algo falla o no mejora, devuelve el original.
export async function comprimirImagen(archivo, opciones = {}) {
  const { maxLado, calidad } = { ...OPCIONES_FOTO, ...opciones };
  if (!archivo || !archivo.type?.startsWith('image/') || archivo.type === 'image/gif') return archivo;

  let imagen;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  } catch {
    return archivo; // formato que este navegador no decodifica: se sube tal cual
  }

  try {
    const { ancho, alto } = calcularDimensiones(imagen.width, imagen.height, maxLado);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#fff'; // el JPEG no tiene transparencia
    ctx.fillRect(0, 0, ancho, alto);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imagen, 0, 0, ancho, alto);

    let blob = await aBlob(lienzo, 'image/webp', calidad);
    if (!blob || blob.type !== 'image/webp') blob = await aBlob(lienzo, 'image/jpeg', calidad);
    if (!blob) return archivo;

    const redimensionada = ancho !== imagen.width || alto !== imagen.height;
    if (!redimensionada && blob.size >= archivo.size) return archivo; // ya era liviana

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `${nombreSinExtension(archivo.name)}.${extension}`, { type: blob.type, lastModified: Date.now() });
  } finally {
    imagen.close?.();
  }
}
