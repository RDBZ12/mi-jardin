import { buscarProductos, formatearPrecio, paginar } from '../servicios/catalogo.js';
import { crearElemento } from '../utils/dom.js';

export const vistaCatalogo = `<section class="app-page oculto" id="pagina-catalogo" data-pagina="catalogo">
          <button class="text-action back-action menu-back-arrow" type="button" id="catalogo-atras" data-i18n-aria-label="volver" aria-label="Volver al menú" title="Volver al menú"><span aria-hidden="true">←</span></button>
          <div id="catalogo-lista-vista">
            <div class="plants-heading"><div><p class="section-eyebrow" data-t="catalogEyebrow">CATÁLOGO</p><h1 data-t="catalogTitle">Catálogo de productos</h1></div></div>
            <p class="page-intro" data-t="catalogIntro">Busca productos por nombre, marca o tipo.</p>
            <label class="search-field"><span class="sr-only" data-t="catalogSearch">Buscar producto</span><input id="catalogo-busqueda" type="search" maxlength="60" autocomplete="off" placeholder="Buscar producto" /></label>
            <p class="catalogo-estado" id="catalogo-estado" role="status" aria-live="polite"></p>
            <div class="catalogo-grid" id="catalogo-grid"></div>
            <nav class="catalogo-paginacion oculto" id="catalogo-paginacion" aria-label="Paginación"></nav>
          </div>
          <article class="catalogo-detalle oculto" id="catalogo-detalle" aria-live="polite"></article>
        </section>`;

let controlador = null;
let temporizador = null;
let ultimaBusqueda = null;
let productosActuales = [];
let totalCoincidencias = 0;
let paginaActual = 1;
let productoAbierto = null;
// Qué mensaje se muestra bajo el buscador. Se guarda el tipo (no el texto) para volver a pintarlo al cambiar de idioma.
let estado = { tipo: 'vacio', termino: '' };

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
  return crearElemento('span', `plant-badge ${producto.disponible ? 'badge-ok' : 'badge-atrasado'}`,
    producto.disponible ? contexto.tApp('catalogAvailable') : contexto.tApp('catalogSoldOut'));
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
  boton.addEventListener('click', () => { productoAbierto = producto; pintarDetalle(contexto); window.scrollTo?.({ top: 0 }); });
  return boton;
}

function pintarDetalle(contexto) {
  const detalle = document.querySelector('#catalogo-detalle');
  const lista = document.querySelector('#catalogo-lista-vista');
  const atras = document.querySelector('#catalogo-atras');
  if (!productoAbierto) {
    detalle.classList.add('oculto');
    lista.classList.remove('oculto');
    atras.setAttribute('aria-label', contexto.tApp('backToMenu'));
    atras.title = contexto.tApp('backToMenu');
    return;
  }
  const producto = productoAbierto;
  const datos = [
    [contexto.tApp('catalogBrand'), producto.marca],
    [contexto.tApp('catalogModel'), producto.modelo],
    [contexto.tApp('catalogCategory'), producto.categoria],
    [contexto.tApp('catalogType'), producto.tipo],
    [contexto.tApp('catalogStock'), contexto.tApp('catalogUnits', { n: producto.existencia })],
  ].filter(([, valor]) => valor !== '');
  const dl = crearElemento('dl', 'catalogo-datos');
  dl.append(...datos.flatMap(([etiqueta, valor]) => [crearElemento('dt', '', etiqueta), crearElemento('dd', '', valor)]));
  detalle.replaceChildren(
    imagenProducto(producto, 'catalogo-imagen-grande'),
    crearElemento('h2', 'catalogo-titulo', producto.nombre),
    crearElemento('p', 'catalogo-precio catalogo-precio-grande', formatearPrecio(producto.precio, producto.moneda, contexto.obtenerIdioma())),
    insignia(producto, contexto),
    crearElemento('p', 'catalogo-descripcion', producto.descripcion),
    dl,
  );
  lista.classList.add('oculto');
  detalle.classList.remove('oculto');
  atras.setAttribute('aria-label', contexto.tApp('catalogBackList'));
  atras.title = contexto.tApp('catalogBackList');
}

function pintarEstado(contexto, pagina) {
  const el = document.querySelector('#catalogo-estado');
  const t = contexto.tApp;
  let texto = '';
  let reintentar = false;
  if (estado.tipo === 'cargando') texto = t('catalogLoading');
  else if (estado.tipo === 'error') { texto = t('catalogError'); reintentar = true; }
  else if (estado.tipo === 'sin-resultados') texto = estado.termino ? t('catalogEmpty', { term: estado.termino }) : t('catalogTypeToSearch');
  else if (estado.tipo === 'rango' && pagina) {
    texto = t('catalogRange', { from: pagina.desde, to: pagina.hasta, total: pagina.total });
    if (totalCoincidencias > pagina.total) texto += ` ${t('catalogCapped', { total: totalCoincidencias })}`;
  }
  el.replaceChildren(texto);
  if (reintentar) {
    const boton = crearElemento('button', 'text-action', t('catalogRetry'));
    boton.type = 'button';
    boton.addEventListener('click', () => void buscar(contexto, { forzar: true }));
    el.append(' ', boton);
  }
}

function pintarLista(contexto) {
  const grid = document.querySelector('#catalogo-grid');
  const nav = document.querySelector('#catalogo-paginacion');
  const p = paginar(productosActuales, paginaActual);
  paginaActual = p.pagina;
  grid.replaceChildren(...p.items.map((producto) => tarjeta(producto, contexto)));
  pintarEstado(contexto, p);
  nav.setAttribute('aria-label', contexto.tApp('catalogPagination'));
  if (!p.total) { nav.classList.add('oculto'); nav.replaceChildren(); return; }
  const crear = (clave, destino, desactivado) => {
    const boton = crearElemento('button', 'button-secondary catalogo-pag-boton', contexto.tApp(clave));
    boton.type = 'button';
    boton.disabled = desactivado;
    boton.addEventListener('click', () => {
      paginaActual = destino;
      pintarLista(contexto);
      document.querySelector('#catalogo-busqueda')?.scrollIntoView?.({ block: 'start' });
    });
    return boton;
  };
  nav.replaceChildren(
    crear('catalogPrev', p.pagina - 1, p.pagina <= 1),
    crearElemento('span', 'catalogo-pag-info', contexto.tApp('catalogPage', { page: p.pagina, pages: p.paginas })),
    crear('catalogNext', p.pagina + 1, p.pagina >= p.paginas),
  );
  nav.classList.toggle('oculto', p.paginas <= 1);
}

async function buscar(contexto, { forzar = false } = {}) {
  const termino = document.querySelector('#catalogo-busqueda').value.trim();
  if (!forzar && termino === ultimaBusqueda) return;
  controlador?.abort();
  controlador = new AbortController();
  const { signal } = controlador;
  const grid = document.querySelector('#catalogo-grid');
  estado = { tipo: 'cargando', termino };
  pintarEstado(contexto);
  grid.setAttribute('aria-busy', 'true');
  try {
    const resultado = await buscarProductos(termino, { signal });
    if (signal.aborted) return;
    ultimaBusqueda = termino;
    productosActuales = resultado.productos;
    totalCoincidencias = resultado.total;
    paginaActual = 1;
    estado = productosActuales.length ? { tipo: 'rango', termino } : { tipo: 'sin-resultados', termino };
    pintarLista(contexto);
  } catch (error) {
    if (error?.name === 'AbortError' || signal.aborted) return;
    ultimaBusqueda = null;
    productosActuales = [];
    estado = { tipo: 'error', termino };
    pintarLista(contexto);
  } finally {
    if (!signal.aborted) grid.removeAttribute('aria-busy');
  }
}

// Se llama al entrar a la vista y cuando cambia el idioma: vuelve a pintar todo con los textos actuales.
export function renderizarCatalogo(contexto) {
  document.querySelector('#catalogo-busqueda').placeholder = contexto.tApp('catalogSearchPlaceholder');
  pintarLista(contexto);
  pintarDetalle(contexto);
  if (ultimaBusqueda === null && estado.tipo !== 'cargando') void buscar(contexto, { forzar: true });
}

export function inicializarCatalogo(contexto) {
  document.querySelector('#catalogo-busqueda')?.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => void buscar(contexto), 350);
  });
  // La flecha de arriba es la única de vuelta: del detalle va a la lista; de la lista, al menú.
  document.querySelector('#catalogo-atras')?.addEventListener('click', () => {
    if (productoAbierto) {
      productoAbierto = null;
      pintarDetalle(contexto);
      return;
    }
    document.querySelectorAll('.subvista').forEach((subvista) => subvista.classList.add('oculto'));
    document.querySelector('#menu-lista-principal')?.classList.remove('oculto');
    contexto.navegarA('menu');
  });
  // Al entrar desde el menú se empieza siempre en la lista, no en un detalle anterior.
  document.querySelector('[data-ir-pagina="catalogo"]')?.addEventListener('click', () => { productoAbierto = null; }, true);
}
