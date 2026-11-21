export const vistaHistorial = "<section class=\"app-page oculto\" id=\"pagina-historial\" data-pagina=\"historial\">\n          <button class=\"text-action back-action menu-back-arrow\" type=\"button\" data-volver-menu data-i18n-aria-label=\"volver\" aria-label=\"Volver al menú\" title=\"Volver al menú\"><span aria-hidden=\"true\">←</span></button>\n          <div class=\"plants-heading\"><div><p class=\"section-eyebrow\">ACTIVIDAD</p><h1>Historial</h1></div></div>\n          <div class=\"filter-list\" aria-label=\"Filtrar historial\">\n            <button class=\"filter-chip activo\" type=\"button\" data-historial-filtro=\"todos\" aria-pressed=\"true\">Todos</button>\n            <button class=\"filter-chip\" type=\"button\" data-historial-filtro=\"riego\" aria-pressed=\"false\">Riego</button>\n            <button class=\"filter-chip\" type=\"button\" data-historial-filtro=\"otros\" aria-pressed=\"false\">Otros cuidados</button>\n          </div>\n          <p class=\"dashboard-message\" id=\"history-message\" role=\"status\" aria-live=\"polite\"></p>\n          <div class=\"timeline\" id=\"historial-lista\"></div>\n        </section>";
import { obtenerHistorialCuidados } from '../servicios/cuidados.js';
import { crearElemento, mostrarVacio } from '../utils/dom.js';

let filtroHistorial = 'todos';

export async function renderizarHistorial(contexto) {
  const mensaje = document.querySelector('#history-message');
  const lista = document.querySelector('#historial-lista');
  mensaje.textContent = contexto.tApp('loadingHistory');
  try {
    const eventos = await obtenerHistorialCuidados();
    const { plantas } = contexto.obtenerEstado();
    const filtrados = eventos.filter((evento) => filtroHistorial === 'todos'
      || (filtroHistorial === 'riego' ? evento.tipo === 'riego' : evento.tipo !== 'riego'));
    mensaje.textContent = filtrados.length === 1 ? contexto.tApp('oneRecord')
      : contexto.tApp('recordsCount', { count: filtrados.length });
    const items = filtrados.map((evento) => {
      const fila = crearElemento('article', 'timeline-item');
      const planta = plantas.find((item) => item.id === evento.planta_id);
      fila.append(
        crearElemento('strong', '', contexto.traduccionTipo(evento.tipo)),
        crearElemento('span', '', `${planta?.nombre || contexto.tApp('plantFallback')}${evento.observaciones ? ` · ${evento.observaciones}` : ''}`),
      );
      const fecha = document.createElement('time');
      fecha.dateTime = evento.fecha_hora;
      fecha.textContent = contexto.formatoFecha(evento.fecha_hora, true);
      fila.append(fecha);
      return fila;
    });
    if (items.length) lista.replaceChildren(...items);
    else mostrarVacio(lista, contexto.tApp('emptyHistory'));
  } catch (error) {
    mensaje.textContent = `${contexto.tApp('loadingHistory')}: ${error.message}`;
    mensaje.dataset.error = 'true';
  }
}

export function inicializarHistorial(contexto) {
  document.querySelectorAll('[data-historial-filtro]').forEach((boton) => boton.addEventListener('click', () => {
    filtroHistorial = boton.dataset.historialFiltro;
    document.querySelectorAll('[data-historial-filtro]').forEach((item) => {
      const activo = item === boton;
      item.classList.toggle('activo', activo);
      item.setAttribute('aria-pressed', String(activo));
    });
    void renderizarHistorial(contexto);
  }));
}
