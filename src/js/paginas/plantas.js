export const vistaPlantas = "<section class=\"app-page oculto\" id=\"pagina-plantas\" data-pagina=\"plantas\">\n          <div class=\"plants-heading\">\n            <div><p class=\"section-eyebrow\">TU COLECCIÓN</p><h1>Mis plantas</h1></div>\n            <button class=\"button-primary\" id=\"btn-abrir-modal\" type=\"button\">Nueva planta</button>\n          </div>\n          <label class=\"search-field\"><span class=\"sr-only\">Buscar plantas</span><input id=\"plant-search\" type=\"search\" placeholder=\"Buscar por nombre o especie\" /></label>\n          <div class=\"filter-list\" aria-label=\"Filtrar plantas por categoría\">\n            <button class=\"filter-chip activo\" type=\"button\" data-categoria=\"todas\" aria-pressed=\"true\">Todas</button>\n            <button class=\"filter-chip\" type=\"button\" data-categoria=\"interior\" aria-pressed=\"false\">Interior</button>\n            <button class=\"filter-chip\" type=\"button\" data-categoria=\"exterior\" aria-pressed=\"false\">Exterior</button>\n            <button class=\"filter-chip\" type=\"button\" data-categoria=\"suculentas\" aria-pressed=\"false\">Suculentas</button>\n            <button class=\"filter-chip\" type=\"button\" data-categoria=\"aromaticas\" aria-pressed=\"false\">Aromáticas</button>\n          </div>\n          <p class=\"dashboard-message\" id=\"plants-message\" role=\"status\" aria-live=\"polite\"></p>\n          <div class=\"grid-plantas\" id=\"lista-plantas\" aria-live=\"polite\"></div>\n        </section>";
import { eliminarPlanta, obtenerUrlFoto } from '../servicios/plantas.js';
import { registrarCuidado } from '../servicios/cuidados.js';
import { crearElemento, limpiarEntrada } from '../utils/dom.js';
import { crearTarjetaPlanta } from '../componentes/tarjetaPlanta.js';

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

async function abrirDetalle(contexto, plantaId) {
  const { plantas } = contexto.obtenerEstado();
  const planta = plantas.find((item) => item.id === plantaId);
  if (!planta) return;
  const { tApp } = contexto;
  const contenedor = document.querySelector('#detalle-contenido');
  contenedor.replaceChildren(crearElemento('p', 'page-intro', tApp('loadingDetail')));
  contexto.navegarA('detalle');

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
  actions.append(water, reminder);
  contenedor.replaceChildren(hero, facts, notes, actions);
}

export function inicializarPlantas(contexto) {
  contexto.abrirDetalle = (id) => abrirDetalle(contexto, id);
  document.querySelector('#btn-abrir-modal')?.addEventListener('click', () => contexto.abrirModalPlanta());
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
