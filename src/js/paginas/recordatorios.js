export const vistaRecordatorios = "<section class=\"app-page oculto\" id=\"pagina-recordatorios\" data-pagina=\"recordatorios\">\n          <div class=\"plants-heading\"><div><p class=\"section-eyebrow\">PLANIFICACIÓN</p><h1>Recordatorios</h1></div><button class=\"button-primary\" id=\"reminder-create-toggle\" type=\"button\">Nuevo recordatorio</button></div>\n          <form id=\"form-recordatorio\" class=\"workflow-form reminder-form oculto\">\n            <label class=\"form-field\" for=\"recordatorio-planta\"><span>Planta</span><select id=\"recordatorio-planta\" required></select></label>\n            <div class=\"form-row\"><label class=\"form-field\" for=\"recordatorio-tipo\"><span>Cuidado</span><select id=\"recordatorio-tipo\"><option value=\"riego\">Riego</option><option value=\"fertilizacion\">Fertilización</option><option value=\"poda\">Poda</option><option value=\"trasplante\">Trasplante</option><option value=\"otro\">Otro</option></select></label><label class=\"form-field\" for=\"recordatorio-fecha\"><span>Fecha y hora</span><input id=\"recordatorio-fecha\" type=\"datetime-local\" required /></label></div>\n            <label class=\"form-field\" for=\"recordatorio-repeticion\"><span>Repetición</span><select id=\"recordatorio-repeticion\"><option value=\"ninguna\">No repetir</option><option value=\"diaria\">Diaria</option><option value=\"semanal\">Semanal</option><option value=\"quincenal\">Cada dos semanas</option><option value=\"mensual\">Mensual</option></select></label>\n            <p class=\"form-error\" id=\"reminder-error\" role=\"alert\"></p>\n            <button class=\"button-primary\" type=\"submit\">Guardar recordatorio</button>\n          </form>\n          <p class=\"dashboard-message\" id=\"reminders-message\" role=\"status\" aria-live=\"polite\"></p>\n          <div class=\"timeline\" id=\"recordatorios-lista\"></div>\n        </section>";
import { completarRecordatorio, guardarRecordatorio, obtenerRecordatoriosPendientes } from '../servicios/recordatorios.js';
import { crearElemento } from '../utils/dom.js';

function actualizarOpciones(contexto) {
  const selector = document.querySelector('#recordatorio-planta');
  const opciones = contexto.obtenerEstado().plantas.map((planta) => {
    const opcion = document.createElement('option');
    opcion.value = planta.id;
    opcion.textContent = planta.nombre;
    return opcion;
  });
  selector.replaceChildren(...opciones);
  if (!opciones.length) {
    const opcion = document.createElement('option');
    opcion.value = '';
    opcion.textContent = contexto.tApp('addPlantFirst');
    selector.append(opcion);
  }
}

export async function renderizarRecordatorios(contexto) {
  const mensaje = document.querySelector('#reminders-message');
  const lista = document.querySelector('#recordatorios-lista');
  mensaje.textContent = contexto.tApp('loadingReminders');
  try {
    const recordatorios = await obtenerRecordatoriosPendientes();
    mensaje.textContent = contexto.tApp('pendingCount', { count: recordatorios.length });
    const items = recordatorios.map((recordatorio) => {
      const fila = crearElemento('article', 'timeline-item');
      const planta = Array.isArray(recordatorio.plantas) ? recordatorio.plantas[0] : recordatorio.plantas;
      fila.append(
        crearElemento('strong', '', recordatorio.titulo),
        crearElemento('span', '', contexto.tApp('careAt', {
          plant: planta?.nombre || contexto.tApp('plantFallback'),
          type: contexto.traduccionTipo(recordatorio.tipo_cuidado),
          repeat: contexto.traduccionRepeticion(recordatorio.repeticion),
        })),
      );
      const completar = crearElemento('button', 'plant-action', contexto.tApp('complete'));
      completar.type = 'button';
      completar.addEventListener('click', async () => {
        completar.disabled = true;
        try {
          await completarRecordatorio(recordatorio.id);
          await renderizarRecordatorios(contexto);
        } catch (error) {
          completar.disabled = false;
          mensaje.textContent = contexto.tApp('completeReminderError', { error: error.message });
          mensaje.dataset.error = 'true';
        }
      });
      fila.append(completar);
      const fecha = document.createElement('time');
      fecha.dateTime = recordatorio.fecha_hora;
      fecha.textContent = contexto.formatoFecha(recordatorio.fecha_hora, true);
      fila.append(fecha);
      return fila;
    });
    if (items.length) lista.replaceChildren(...items);
    else contexto.mostrarVacio(lista, contexto.tApp('emptyReminders'));
  } catch (error) {
    mensaje.textContent = `${contexto.tApp('loadingReminders')}: ${error.message}`;
    mensaje.dataset.error = 'true';
  }
}

export function inicializarRecordatorios(contexto) {
  contexto.actualizarOpcionesRecordatorio = () => actualizarOpciones(contexto);
  document.querySelector('#reminder-create-toggle').addEventListener('click', () => {
    const formulario = document.querySelector('#form-recordatorio');
    formulario.classList.toggle('oculto');
    if (!formulario.classList.contains('oculto')) {
      const fecha = new Date(Date.now() + 60 * 60 * 1000);
      fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
      document.querySelector('#recordatorio-fecha').value = fecha.toISOString().slice(0, 16);
    }
  });
  document.querySelector('#form-recordatorio').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const form = evento.currentTarget;
    const error = document.querySelector('#reminder-error');
    error.textContent = '';
    const plantaId = document.querySelector('#recordatorio-planta').value;
    const planta = contexto.obtenerEstado().plantas.find((item) => item.id === plantaId);
    if (!planta) { error.textContent = contexto.tApp('addPlantFirst'); return; }
    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
      const fecha = new Date(document.querySelector('#recordatorio-fecha').value);
      if (Number.isNaN(fecha.getTime()) || fecha <= new Date()) throw new Error(contexto.tApp('invalidReminderDate'));
      const tipo = document.querySelector('#recordatorio-tipo').value;
      await guardarRecordatorio({
        planta_id: planta.id,
        tipo_cuidado: tipo,
        titulo: `${contexto.traduccionTipo(tipo)} · ${planta.nombre}`,
        fecha_hora: fecha.toISOString(),
        repeticion: document.querySelector('#recordatorio-repeticion').value,
      });
      form.reset();
      form.classList.add('oculto');
      await renderizarRecordatorios(contexto);
    } catch (errorGuardar) {
      error.textContent = errorGuardar.message;
    } finally {
      boton.disabled = false;
    }
  });
}
