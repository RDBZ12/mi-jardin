import { crearElemento } from '../utils/dom.js';
import { registrarCuidado, obtenerHistorialCuidados } from '../servicios/cuidados.js';
import { obtenerUrlFoto } from '../servicios/plantas.js';
import { ESTADOS_SALUD } from '../utils/salud.js';
import { traduccionSalud, tApp, traduccionTipo } from '../utils/idiomas.js';

export function crearInsigniaSalud(estado) {
  const insignia = crearElemento('span', `health-badge health-${estado || 'sin'}`, traduccionSalud(estado));
  return insignia;
}

// Formulario "¿Cómo está hoy?": estado (3 opciones), nota y foto opcional.
export function crearFormularioRevision(planta, alGuardar) {
  const formulario = crearElemento('form', 'workflow-form review-form');
  formulario.noValidate = true;
  formulario.append(crearElemento('h2', 'review-title', tApp('howIsPlant')));

  const grupo = crearElemento('div', 'health-options');
  grupo.setAttribute('role', 'radiogroup');
  grupo.setAttribute('aria-label', tApp('howIsPlant'));
  for (const estado of ESTADOS_SALUD) {
    const etiqueta = crearElemento('label', `health-option health-${estado}`);
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'estado-salud';
    radio.value = estado;
    etiqueta.append(radio, crearElemento('span', '', traduccionSalud(estado)));
    grupo.append(etiqueta);
  }

  const nota = document.createElement('textarea');
  nota.rows = 3;
  nota.maxLength = 2000;
  nota.placeholder = tApp('reviewNotePlaceholder');
  nota.id = 'revision-nota';
  const campoNota = crearElemento('label', 'form-field');
  campoNota.htmlFor = 'revision-nota';
  campoNota.append(crearElemento('span', '', tApp('reviewNote')), nota);

  const foto = document.createElement('input');
  foto.type = 'file';
  foto.accept = 'image/jpeg,image/png,image/webp';
  foto.id = 'revision-foto';
  const campoFoto = crearElemento('label', 'form-field');
  campoFoto.htmlFor = 'revision-foto';
  campoFoto.append(crearElemento('span', '', tApp('reviewPhoto')), foto);

  const error = crearElemento('p', 'form-error');
  error.setAttribute('role', 'alert');
  const guardar = crearElemento('button', 'button-primary', tApp('saveReview'));
  guardar.type = 'submit';
  formulario.append(grupo, campoNota, campoFoto, error, guardar);

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    error.textContent = '';
    const elegido = formulario.querySelector('input[name="estado-salud"]:checked')?.value;
    if (!elegido) { error.textContent = tApp('chooseHealth'); return; }
    const archivo = foto.files[0] || null;
    if (archivo && archivo.size > 5 * 1024 * 1024) { error.textContent = tApp('reviewSaveError', { error: '5 MB' }); return; }

    guardar.disabled = true;
    guardar.textContent = tApp('saving');
    try {
      await registrarCuidado(planta.id, 'revision', nota.value.trim(), { estadoSalud: elegido, foto: archivo });
      await alGuardar();
    } catch (fallo) {
      error.textContent = tApp('reviewSaveError', { error: fallo.message });
      guardar.disabled = false;
      guardar.textContent = tApp('saveReview');
    }
  });
  return formulario;
}

// Línea de tiempo de una planta: riegos, cuidados y revisiones (con foto si la hay).
export async function crearLineaTiempo(planta, formatoFecha) {
  const seccion = crearElemento('section', 'plant-timeline');
  seccion.append(crearElemento('h2', 'review-title', tApp('timelineTitle')));
  let eventos = [];
  try {
    eventos = await obtenerHistorialCuidados(planta.id);
  } catch {
    eventos = [];
  }
  if (!eventos.length) {
    seccion.append(crearElemento('p', 'page-intro', tApp('noTimeline')));
    return seccion;
  }

  const lista = crearElemento('div', 'timeline');
  for (const evento of eventos.slice(0, 30)) {
    const fila = crearElemento('article', `timeline-item timeline-salud-${evento.estado_salud || 'ninguno'}`);
    const titulo = crearElemento('strong', '', traduccionTipo(evento.tipo));
    if (evento.estado_salud) titulo.append(' · ', crearInsigniaSalud(evento.estado_salud));
    const detalle = crearElemento('span', '', evento.observaciones || '');
    const fecha = document.createElement('time');
    fecha.dateTime = evento.fecha_hora;
    fecha.textContent = formatoFecha(evento.fecha_hora, true);
    fila.append(titulo, detalle, fecha);
    if (evento.foto_ruta) {
      const miniatura = crearElemento('img', 'timeline-photo');
      miniatura.alt = '';
      miniatura.loading = 'lazy';
      fila.append(miniatura);
      void obtenerUrlFoto(evento).then((url) => { if (url) miniatura.src = url; else miniatura.remove(); });
    }
    lista.append(fila);
  }
  seccion.append(lista);
  return seccion;
}
