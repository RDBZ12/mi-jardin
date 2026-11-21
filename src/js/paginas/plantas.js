export const vistaPlantas = "<section class=\"app-page oculto\" id=\"pagina-plantas\" data-pagina=\"plantas\">\n          <div class=\"plants-heading\">\n            <div><p class=\"section-eyebrow\">TU COLECCIÓN</p><h1>Mis plantas</h1></div>\n            <button class=\"button-primary\" id=\"btn-abrir-modal\" type=\"button\">Nueva planta</button>\n          </div>\n          <label class=\"search-field\"><span class=\"sr-only\">Buscar plantas</span><input id=\"plant-search\" type=\"search\" placeholder=\"Buscar por nombre o especie\" /></label>\n          <div class=\"filter-list\" aria-label=\"Filtrar plantas por categoría\">\n            <button class=\"filter-chip activo\" type=\"button\" data-categoria=\"todas\" aria-pressed=\"true\">Todas</button>\n            <button class=\"filter-chip\" type=\"button\" data-categoria=\"interior\" aria-pressed=\"false\">Interior</button>\n            <button class=\"filter-chip\" type=\"button\" data-categoria=\"exterior\" aria-pressed=\"false\">Exterior</button>\n            <button class=\"filter-chip\" type=\"button\" data-categoria=\"suculentas\" aria-pressed=\"false\">Suculentas</button>\n            <button class=\"filter-chip\" type=\"button\" data-categoria=\"aromaticas\" aria-pressed=\"false\">Aromáticas</button>\n          </div>\n          <p class=\"dashboard-message\" id=\"plants-message\" role=\"status\" aria-live=\"polite\"></p>\n          <div class=\"grid-plantas\" id=\"lista-plantas\" aria-live=\"polite\"></div>\n        </section>";
import { eliminarPlanta, obtenerPlantas, obtenerUrlFoto } from '../servicios/plantas.js';
import { registrarCuidado } from '../servicios/cuidados.js';
import { crearElemento, limpiarEntrada } from '../utils/dom.js';
import { crearTarjetaPlanta } from '../componentes/tarjetaPlanta.js';
import { crearFormularioRevision, crearLineaTiempo, crearInsigniaSalud } from '../componentes/seguimientoSalud.js';

let filtroCategoria = 'todas';

export function renderizarPlantas(contexto) {
  const { plantas } = contexto.obtenerEstado();
  const lista = document.querySelector('#lista-plantas');
  const termino = limpiarEntrada(document.querySelector('#plant-search')).toLocaleLowerCase('es');
  const visibles = plantas.filter((planta) => {
    const coincideCategoria = filtroCategoria === 'todas' || planta.categoria === filtroCategoria;
    const texto = `${planta.nombre} ${planta.nombre_cientifico || ''} ${planta.categoria || ''}`.toLocaleLowerCase('es');
    return coincideCategoria && (!termino || texto.includes(termino));
  });

  document.querySelector('#plants-message').textContent = contexto.tApp(
    plantas.length === 1 ? 'onePlantCount' : 'plantsCount',
    { visible: visibles.length, total: plantas.length },
  );
  void contexto.tarjetasPara(visibles).then((tarjetas) => {
    if (contexto.obtenerEstado().vistaActual !== 'plantas') return;
    if (!tarjetas.length) {
      const empty = crearElemento('div', 'empty-state');
      empty.append(
        crearElemento('h2', '', plantas.length ? contexto.tApp('noMatches') : contexto.tApp('noPlants')),
        crearElemento('p', '', plantas.length ? contexto.tApp('tryOtherSearch') : contexto.tApp('startByAdding')),
      );
      lista.replaceChildren(empty);
      return;
    }
    lista.replaceChildren(...tarjetas.map(({ planta, urlFoto }) => crearTarjetaPlanta(planta, urlFoto, true, {
      tApp: contexto.tApp,
      traduccionCategoria: contexto.traduccionCategoria,
      calcularEstadoRiego: contexto.calcularEstadoRiego,
    })));
  });
}

async function abrirDetalle(contexto, plantaId, plantaActualizada = null) {
  const { plantas } = contexto.obtenerEstado();
  const planta = plantaActualizada || plantas.find((item) => item.id === plantaId);
  if (!planta) return;
  const { tApp } = contexto;
  const contenedor = document.querySelector('#detalle-contenido');
  contenedor.replaceChildren(crearElemento('p', 'page-intro', tApp('loadingDetail')));
  contexto.navegarA('detalle', 'plantas');

  const urlFoto = await obtenerUrlFoto(planta.foto_ruta);
  const hero = crearElemento('div', 'detail-hero');
  if (urlFoto) {
    const image = document.createElement('img');
    image.src = urlFoto;
    image.alt = `Foto de ${planta.nombre}`;
    hero.append(image);
  } else {
    hero.append(crearElemento('div', 'detail-placeholder', tApp('noPhotoData')));
  }
  const copy = document.createElement('div');
  copy.append(
    crearElemento('p', 'section-eyebrow', tApp('detailEyebrow')),
    crearElemento('h1', '', planta.nombre),
    crearElemento('p', 'detail-meta', planta.nombre_cientifico || planta.categoria || 'Planta'),
    crearElemento('p', 'detail-meta', contexto.calcularEstadoRiego(planta).texto),
  );
  hero.append(copy);

  const facts = crearElemento('div', 'detail-grid');
  const datos = [
    [tApp('categoryLabel'), contexto.traduccionCategoria(planta.categoria)],
    [tApp('waterFrequency'), planta.frecuencia_riego_dias ? tApp('wateringIn', { days: planta.frecuencia_riego_dias }) : tApp('noData')],
    [tApp('lightLabel'), contexto.traduccionLuz(planta.necesidad_luz)],
    ['Temperatura', planta.temperatura_min_c != null || planta.temperatura_max_c != null
      ? `${planta.temperatura_min_c ?? '—'} a ${planta.temperatura_max_c ?? '—'} °C`
      : tApp('noData')],
    [tApp('soilLabel'), planta.tipo_suelo],
    [tApp('locationLabel'), planta.ubicacion],
  ];
  for (const [titulo, valor] of datos) {
    const fact = crearElemento('div', 'detail-fact');
    fact.append(crearElemento('span', '', titulo), crearElemento('strong', '', valor || tApp('noData')));
    facts.append(fact);
  }

  const notes = crearElemento('p', 'page-intro', planta.notas || planta.descripcion || tApp('noNotes'));
  const actions = crearElemento('div', 'plant-actions');
  const water = crearElemento('button', 'button-primary', tApp('logWater'));
  water.type = 'button';
  water.addEventListener('click', () => contexto.navegarA('riego'));
  const reminder = crearElemento('button', 'button-secondary', tApp('createReminder'));
  reminder.type = 'button';
  reminder.addEventListener('click', () => {
    contexto.navegarA('recordatorios');
    document.querySelector('#recordatorio-planta').value = planta.id;
    document.querySelector('#form-recordatorio').classList.remove('oculto');
  });
  const revisar = crearElemento('button', 'button-secondary', tApp('reviewPlant'));
  revisar.type = 'button';
  actions.append(water, revisar, reminder);

  const resumenSalud = crearElemento('div', 'plant-health-row');
  resumenSalud.append(
    crearElemento('span', 'plant-health-label', tApp('healthLabel')),
    crearInsigniaSalud(planta.estado_salud),
    crearElemento('small', '', planta.ultima_revision
      ? tApp('lastReview', { date: contexto.formatoFecha(planta.ultima_revision) })
      : ''),
  );

  const zonaRevision = crearElemento('div', 'review-zone');
  revisar.addEventListener('click', () => {
    if (zonaRevision.firstChild) { zonaRevision.replaceChildren(); return; }
    zonaRevision.replaceChildren(crearFormularioRevision(planta, async () => {
      await contexto.cargarJardin();
      // Lectura directa: otra carga en curso podría haber dejado la lista del estado desactualizada.
      const frescas = await obtenerPlantas();
      await abrirDetalle(contexto, planta.id, frescas.find((item) => item.id === planta.id));
    }));
    zonaRevision.querySelector('input')?.focus();
  });

  contenedor.replaceChildren(hero, resumenSalud, facts, notes, actions, zonaRevision);
  const lineaTiempo = await crearLineaTiempo(planta, contexto.formatoFecha);
  if (contenedor.isConnected && contenedor.contains(zonaRevision)) contenedor.append(lineaTiempo);
}

export function inicializarPlantas(contexto) {
  contexto.abrirDetalle = (id) => abrirDetalle(contexto, id);
  document.querySelector('#detalle-volver')?.addEventListener('click', () => contexto.navegarA('plantas'));
  document.querySelector('#btn-abrir-modal')?.addEventListener('click', () => contexto.abrirModalPlanta(null, { pantallaCompleta: true, ruta: 'plantas', pestana: 'plantas' }));
  document.querySelector('#plant-search').addEventListener('input', () => renderizarPlantas(contexto));
  document.querySelectorAll('[data-categoria]').forEach((boton) => boton.addEventListener('click', () => {
    filtroCategoria = boton.dataset.categoria;
    document.querySelectorAll('[data-categoria]').forEach((item) => {
      const activo = item === boton;
      item.classList.toggle('activo', activo);
      item.setAttribute('aria-pressed', String(activo));
    });
    renderizarPlantas(contexto);
  }));
  document.querySelector('#lista-plantas').addEventListener('click', async (evento) => {
    const boton = evento.target.closest('button[data-action]');
    if (!boton) return;
    const { action, id } = boton.dataset;
    if (action === 'eliminar' && !window.confirm(contexto.tApp('deletePlantConfirm'))) return;
    if (action === 'detalle') {
      await abrirDetalle(contexto, id);
      return;
    }
    boton.disabled = true;
    try {
      if (action === 'regar') {
        boton.textContent = contexto.tApp('waterProgress');
        await registrarCuidado(id, 'riego', contexto.tApp('waterHistoryNote'));
      } else if (action === 'eliminar') {
        await eliminarPlanta(id);
      }
      await contexto.cargarJardin();
    } catch (error) {
      contexto.mostrarMensaje(contexto.tApp('actionError', { error: error.message }), true);
      boton.disabled = false;
    }
  });
}

export const vistaDetalle = "<section class=\"app-page oculto\" id=\"pagina-detalle\" data-pagina=\"detalle\">\n          <button class=\"text-action back-action menu-back-arrow\" id=\"detalle-volver\" type=\"button\" data-i18n-aria-label=\"backToPlants\" aria-label=\"Volver a mis plantas\" title=\"Volver a mis plantas\"><span aria-hidden=\"true\">←</span></button>\n          <div id=\"detalle-contenido\"></div>\n        </section>";
