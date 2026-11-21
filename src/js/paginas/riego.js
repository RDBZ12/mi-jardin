export const vistaRiego = "<section class=\"app-page oculto\" id=\"pagina-riego\" data-pagina=\"riego\">\n          <div class=\"plants-heading\"><div><p class=\"section-eyebrow\">CUIDADO DIARIO</p><h1>Registrar riego</h1></div></div>\n          <p class=\"page-intro\" id=\"riego-date\"></p>\n          <form id=\"form-riego\" class=\"workflow-form\">\n            <div class=\"section-heading\"><h2>Elige las plantas</h2><span id=\"riego-seleccionadas\">0 seleccionadas</span></div>\n            <div class=\"watering-list\" id=\"riego-plantas\"></div>\n            <label class=\"form-field\" for=\"riego-cantidad\"><span>Cantidad por planta (ml)</span><input id=\"riego-cantidad\" type=\"number\" min=\"1\" step=\"1\" required placeholder=\"Ej. 250\" /></label>\n            <label class=\"form-field\" for=\"riego-notas\"><span>Observación <span class=\"optional\">(opcional)</span></span><textarea id=\"riego-notas\" rows=\"3\" maxlength=\"2000\"></textarea></label>\n            <p class=\"form-error\" id=\"riego-error\" role=\"alert\"></p>\n            <button class=\"button-primary\" id=\"riego-submit\" type=\"submit\">Guardar riego</button>\n          </form>\n        </section>";
import { registrarCuidado } from '../servicios/cuidados.js';
import { crearElemento } from '../utils/dom.js';

export function renderizarRiego(contexto) {
  const { plantas } = contexto.obtenerEstado();
  const lista = document.querySelector('#riego-plantas');
  lista.replaceChildren();
  for (const planta of plantas) {
    const fila = crearElemento('label', 'watering-option');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'plantaRiego';
    checkbox.value = planta.id;
    const copy = document.createElement('span');
    copy.append(
      crearElemento('strong', '', planta.nombre),
      crearElemento('small', '', contexto.calcularEstadoRiego(planta).texto),
    );
    fila.append(checkbox, copy);
    lista.append(fila);
  }
  actualizarSeleccionRiego(contexto);
}

function actualizarSeleccionRiego(contexto) {
  const seleccionadas = document.querySelectorAll('#riego-plantas input:checked').length;
  document.querySelector('#riego-seleccionadas').textContent = contexto.tApp('selected', { count: seleccionadas });
}

export function inicializarRiego(contexto) {
  const lista = document.querySelector('#riego-plantas');
  const formulario = document.querySelector('#form-riego');
  lista.addEventListener('change', () => actualizarSeleccionRiego(contexto));
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const error = document.querySelector('#riego-error');
    error.textContent = '';
    const ids = [...lista.querySelectorAll('input:checked')].map((checkbox) => checkbox.value);
    const cantidad = Number(document.querySelector('#riego-cantidad').value);
    if (!ids.length) { error.textContent = contexto.tApp('choosePlantFirst'); return; }
    if (!Number.isFinite(cantidad) || cantidad <= 0) { error.textContent = contexto.tApp('invalidWaterAmount'); return; }

    const boton = document.querySelector('#riego-submit');
    boton.disabled = true;
    boton.textContent = contexto.tApp('saving');
    const observaciones = [`${cantidad} ml per plant`, document.querySelector('#riego-notas').value.trim()].filter(Boolean).join(' · ');
    let guardados = 0;
    try {
      for (const id of ids) {
        await registrarCuidado(id, 'riego', observaciones);
        guardados += 1;
      }
      formulario.reset();
      error.textContent = '';
      await contexto.cargarJardin();
      await contexto.renderizarHistorial();
      window.alert(guardados === 1 ? contexto.tApp('savedOneWater') : contexto.tApp('savedWater', { count: guardados }));
    } catch (errorGuardar) {
      error.textContent = guardados
        ? contexto.tApp('partialWaterError', { count: guardados, error: errorGuardar.message })
        : contexto.tApp('waterSaveError', { error: errorGuardar.message });
    } finally {
      boton.disabled = false;
      boton.textContent = contexto.tApp('saveWater');
      renderizarRiego(contexto);
    }
  });
}
