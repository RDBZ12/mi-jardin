// Cliente del catálogo de productos de Softecard (API de práctica del curso).
// GET productos.php?consulta=<texto> → { estado, consulta, total_catalogo, total_resultados, productos[] }
const URL_CATALOGO = 'https://softecard.net/productos.php';

// El servidor devuelve el texto con doble codificación ("TelÃ©fono" en vez de "Teléfono").
// Se revierte reinterpretando cada carácter como un byte UTF-8; si el texto ya está bien, no se toca.
export function arreglarTexto(valor) {
  if (typeof valor !== 'string' || !/[ÂÃ]/.test(valor)) return valor;
  try {
    const bytes = Uint8Array.from(valor, (c) => {
      const codigo = c.charCodeAt(0);
      if (codigo > 255) throw new Error('no es latin1');
      return codigo;
    });
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return valor;
  }
}

// Las URLs de imagen se usan tal como llegan de la API (solo se exige https).
function urlHttps(url) {
  return typeof url === 'string' && url.startsWith('https://') ? url : '';
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

// Solo se conservan los campos que la app muestra. "costo" (lo que le cuesta a la tienda) se descarta a propósito.
export function normalizarProducto(crudo) {
  return {
    id: crudo.id,
    nombre: arreglarTexto(crudo.nombre_comercial || crudo.nombre || ''),
    descripcion: arreglarTexto(crudo.descripcion || ''),
    imagen: urlHttps(crudo.imagen),
    imagenRespaldo: urlHttps(crudo.imagen_respaldo),
    marca: arreglarTexto(crudo.marca || ''),
    modelo: arreglarTexto(crudo.modelo || ''),
    categoria: arreglarTexto(crudo.categoria || ''),
    tipo: arreglarTexto(crudo.tipo || ''),
    precio: numero(crudo.precio),
    moneda: /^[A-Z]{3}$/.test(crudo.moneda ?? '') ? crudo.moneda : 'DOP',
    existencia: numero(crudo.existencia) ?? 0,
    disponible: crudo.disponible === true && (numero(crudo.existencia) ?? 1) > 0,
  };
}

// Siempre en es-DO: así el peso dominicano sale como "RD$" también con la app en inglés.
export function formatearPrecio(precio, moneda) {
  if (precio == null) return '';
  try {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: moneda }).format(precio);
  } catch {
    return `${moneda} ${precio}`;
  }
}

export async function buscarProductos(texto, { signal } = {}) {
  const url = `${URL_CATALOGO}?consulta=${encodeURIComponent(String(texto ?? '').trim())}`;
  const respuesta = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  const datos = await respuesta.json();
  if (datos?.estado !== 'ok' || !Array.isArray(datos.productos)) throw new Error('Respuesta inesperada del catálogo');
  return {
    total: numero(datos.total_resultados) ?? datos.productos.length,
    catalogo: numero(datos.total_catalogo) ?? datos.productos.length,
    productos: datos.productos.map(normalizarProducto),
  };
}

export const PRODUCTOS_POR_PAGINA = 12;

// Paginación en el cliente: la API no ofrece páginas, devuelve hasta 100 resultados por búsqueda.
export function paginar(items, pagina, tamano = PRODUCTOS_POR_PAGINA) {
  const total = items.length;
  const paginas = Math.max(1, Math.ceil(total / tamano));
  const actual = Math.min(Math.max(1, Math.trunc(pagina) || 1), paginas);
  const desde = (actual - 1) * tamano;
  return { items: items.slice(desde, desde + tamano), pagina: actual, paginas, desde: total ? desde + 1 : 0, hasta: Math.min(desde + tamano, total), total };
}
