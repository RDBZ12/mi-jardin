import { buscarProductos, formatearPrecio } from '../servicios/catalogo.js';
import { crearElemento } from '../utils/dom.js';

export const vistaCatalogo = `<section class="app-page oculto" id="pagina-catalogo" data-pagina="catalogo">
          <button class="text-action back-action menu-back-arrow" type="button" data-volver-menu data-i18n-aria-label="volver" aria-label="Volver al menú" title="Volver al menú"><span aria-hidden="true">←</span></button>
          <div id="catalogo-lista-vista">
            <div class="plants-heading"><div><p class="section-eyebrow" data-t="catalogEyebrow">CATÁLOGO</p><h1 data-t="catalogTitle">Catálogo de productos</h1></div></div>
            <p class="page-intro" data-t="catalogIntro">Busca productos por nombre, marca o tipo.</p>
            <label class="search-field"><span class="sr-only" data-t="catalogSearch">Buscar producto</span><input id="catalogo-busqueda" type="search" maxlength="60" autocomplete="off" placeholder="Buscar producto" /></label>
            <p class="catalogo-estado" id="catalogo-estado" role="status" aria-live="polite"></p>
            <div class="catalogo-grid" id="catalogo-grid"></div>
          </div>
          <article class="catalogo-detalle oculto" id="catalogo-detalle" aria-live="polite"></article>
        </section>`;

let controlador = null;
let temporizador = null;
let ultimaBusqueda = null;
let productosActuales = [];

function imagenProducto(producto, clase) {
  const img = crearElemento('img', clase);
  img.alt = producto.nombre;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  const fuentes = [producto.imagen, producto.imagenRespaldo].filter(Boolean);
  let indice = 0;
  img.addEventListener('error', () => {
    indice += 1;
    if (indice < fuentes.length) img.src = fuentes[indice];
    else img.classList.add('sin-imagen');
  });
  if (fuentes.length) img.src = fuentes[0];
  else img.classList.add('sin-imagen');
  return img;
}

function insignia(producto, contexto) {
  const el = crearElemento('span', `plant-badge ${producto.disponible ? 'badge-ok' : 'badge-atrasado'}`,
    producto.disponible ? contexto.tApp('catalogAvailable') : contexto.tApp('catalogSoldOut'));
  return el;
}

function tarjeta(producto, contexto) {
  const boton = crearElemento('button', 'catalogo-tarjeta');
  boton.type = 'button';
  const info = crearElemento('div', 'catalogo-info');
  info.append(
    crearElemento('span', 'catalogo-marca', producto.marca),
    crearElemento('strong', 'catalogo-nombre', producto.nombre),
    crearElemento('span', 'catalogo-precio', formatearPrecio(producto.precio, producto.moneda, contexto.obtenerIdioma())),
    insignia(producto, contexto),
  );
  boton.append(imagenProducto(producto, 'catalogo-imagen'), info);
  boton.addEventListener('click', () => abrirDetalle(producto, contexto));
  return boton;
}

function abrirDetalle(producto, contexto) {
  const detalle = document.querySelector('#catalogo-detalle');
  const atras = crearElemento('button', 'text-action back-action');
  atras.type = 'button';
  atras.append(crearElemento('span', '', '← '), crearElemento('span', '', contexto.tApp('catalogBackList')));
  atras.addEventListener('click', cerrarDetalle);
  const datos = [
    [contexto.tApp('catalogBrand'), producto.marca],
    [contexto.tApp('catalogModel'), producto.modelo],
    [contexto.tApp('catalogCategory'), producto.categoria],
    [contexto.tApp('catalogType'), producto.tipo],
    [contexto.tApp('catalogStock'), contexto.tApp('catalogUnits', { n: producto.existencia })],
  ].filter(([, valor]) => valor !== '');
  const lista = crearElemento('dl', 'catalogo-datos');
  lista.append(...datos.flatMap(([etiqueta, valor]) => [crearElemento('dt', '', etiqueta), crearElemento('dd', '', valor)]));
  detalle.replaceChildren(
    atras,
    imagenProducto(producto, 'catalogo-imagen-grande'),
    crearElemento('h2', 'catalogo-titulo', producto.nombre),
    crearElemento('p', 'catalogo-precio catalogo-precio-grande', formatearPrecio(producto.precio, producto.moneda, contexto.obtenerIdioma())),
    insignia(producto, contexto),
    crearElemento('p', 'catalogo-descripcion', producto.descripcion),
    lista,
  );
  document.querySelector('#catalogo-lista-vista').classList.add('oculto');
  detalle.classList.remove('oculto');
  window.scrollTo?.({ top: 0 });
}

function cerrarDetalle() {
  document.querySelector('#catalogo-detalle').classList.add('oculto');
  document.querySelector('#catalogo-lista-vista').classList.remove('oculto');
}

function mostrarEstado(texto, { reintentar = null, contexto } = {}) {
  const estado = document.querySelector('#catalogo-estado');
  estado.replaceChildren(texto);
  if (reintentar) {
    const boton = crearElemento('button', 'text-action', contexto.tApp('catalogRetry'));
    boton.type = 'button';
    boton.addEventListener('click', reintentar);
    estado.append(' ', boton);
  }
}

async function buscar(contexto, { forzar = false } = {}) {
  const termino = document.querySelector('#catalogo-busqueda').value.trim();
  if (!forzar && termino === ultimaBusqueda) return;
  controlador?.abort();
  controlador = new AbortController();
  const { signal } = controlador;
  const grid = document.querySelector('#catalogo-grid');
  mostrarEstado(contexto.tApp('catalogLoading'), { contexto });
  grid.setAttribute('aria-busy', 'true');
  try {
    const resultado = await buscarProductos(termino, { signal });
    if (signal.aborted) return;
    ultimaBusqueda = termino;
    productosActuales = resultado.productos;
    grid.replaceChildren(...productosActuales.map((p) => tarjeta(p, contexto)));
    if (!productosActuales.length) {
      mostrarEstado(termino ? contexto.tApp('catalogEmpty', { term: termino }) : contexto.tApp('catalogTypeToSearch'), { contexto });
    } else {
      mostrarEstado(contexto.tApp('catalogShowing', { shown: productosActuales.length, total: resultado.total }), { contexto });
    }
  } catch (error) {
    if (error?.name === 'AbortError' || signal.aborted) return;
    ultimaBusqueda = null;
    grid.replaceChildren();
    mostrarEstado(contexto.tApp('catalogError'), { reintentar: () => buscar(contexto, { forzar: true }), contexto });
  } finally {
    if (!signal.aborted) grid.removeAttribute('aria-busy');
  }
}

export function renderizarCatalogo(contexto) {
  cerrarDetalle();
  const entrada = document.querySelector('#catalogo-busqueda');
  entrada.placeholder = contexto.tApp('catalogSearchPlaceholder');
  void buscar(contexto, { forzar: ultimaBusqueda === null });
}

export function inicializarCatalogo(contexto) {
  document.querySelector('#catalogo-busqueda')?.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => void buscar(contexto), 350);
  });
}
