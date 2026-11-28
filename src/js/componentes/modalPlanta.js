import { limpiarEntrada } from '../utils/dom.js';
import { buscarEspeciePorNombre, catalogoEspecies } from '../datos/catalogoEspecies.js';

export const vistaModalPlanta = "<div class=\"modal oculto\" id=\"modal-planta\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"modal-titulo\">\n        <div class=\"modal-contenido\">\n          <div class=\"modal-heading\">\n            <div>\n              <p class=\"section-eyebrow\">TU JARDÍN</p>\n              <h2 id=\"modal-titulo\">Agregar una planta</h2>\n            </div>\n            <button class=\"icon-button\" id=\"btn-cerrar-modal\" type=\"button\" aria-label=\"Cerrar formulario\">×</button>\n          </div>\n          <form id=\"form-planta\">\n            <label class=\"form-field\" for=\"planta-nombre\">\n              <span>Nombre</span>\n              <input type=\"text\" id=\"planta-nombre\" maxlength=\"100\" required placeholder=\"Ej. Monstera del salón\" />\n            </label>\n            <label class=\"form-field\" for=\"planta-especie\">\n              <span>Nombre científico <span class=\"optional\">(opcional)</span></span>\n              <input type=\"text\" id=\"planta-especie\" maxlength=\"150\" placeholder=\"Ej. Monstera deliciosa\" />\n            </label>\n            <div class=\"form-row\">\n              <label class=\"form-field\" for=\"planta-categoria\">\n                <span>Categoría</span>\n                <select id=\"planta-categoria\">\n                  <option value=\"interior\">Interior</option>\n                  <option value=\"exterior\">Exterior</option>\n                  <option value=\"suculentas\">Suculentas</option>\n                  <option value=\"cactus\">Cactus</option>\n                  <option value=\"aromaticas\">Aromáticas</option>\n                  <option value=\"ornamentales\">Ornamentales</option>\n                  <option value=\"otras\">Otras</option>\n                </select>\n              </label>\n              <label class=\"form-field\" for=\"planta-frecuencia\">\n                <span>Riego cada (días)</span>\n                <input type=\"number\" id=\"planta-frecuencia\" min=\"1\" max=\"365\" value=\"7\" required />\n              </label>\n            </div>\n            <label class=\"form-field\" for=\"planta-foto\">\n              <span>Foto <span class=\"optional\">(opcional)</span></span>\n              <input type=\"file\" id=\"planta-foto\" accept=\"image/jpeg,image/png,image/webp\" />\n            </label>\n            <label class=\"form-field\" for=\"planta-notas\">\n              <span>Notas de cuidado <span class=\"optional\">(opcional)</span></span>\n              <textarea id=\"planta-notas\" rows=\"3\" maxlength=\"4000\" placeholder=\"Luz, sustrato u otros detalles\"></textarea>\n            </label>\n            <p class=\"form-error\" id=\"error-planta\" role=\"alert\"></p>\n            <div class=\"modal-actions\">\n              <button class=\"button-secondary\" id=\"btn-cancelar-modal\" type=\"button\">Cancelar</button>\n              <button class=\"button-primary\" id=\"btn-guardar-planta\" type=\"submit\">Guardar planta</button>\n            </div>\n          </form>\n        </div>\n      </div>";

let contextoModal;
let modalPlanta;
let formPlanta;
let errorPlanta;
let botonGuardarPlanta;
let fotoSeleccionada;
let fotoPreview;
let fotoPreviewUrl;
let modalPantallaCompleta = false;
let rutaRegresoModal = 'inicio';
let pestanaRegresoModal = 'inicio';

export function abrirModalPlanta(plantaEditar = null, opciones = {}) {
  if (!modalPlanta) return;
  modalPantallaCompleta = Boolean(opciones.pantallaCompleta);
  rutaRegresoModal = opciones.ruta || 'inicio';
  pestanaRegresoModal = opciones.pestana || rutaRegresoModal;
  modalPlanta.classList.toggle('modal-planta-fullscreen', modalPantallaCompleta);
  document.querySelector('#vista-app')?.classList.toggle('modal-planta-activa', modalPantallaCompleta);
  if (modalPantallaCompleta) contextoModal.navegarA(rutaRegresoModal, pestanaRegresoModal);
  errorPlanta.textContent = '';
  formPlanta.reset();
  fotoSeleccionada = null;
  document.querySelector('#planta-id').value = plantaEditar?.id || '';
  document.querySelector('#modal-titulo').textContent = contextoModal.tApp(plantaEditar ? 'editPlant' : 'addPlantTitle');
  document.querySelector('#planta-nombre').value = plantaEditar?.nombre_cientifico || plantaEditar?.nombre || '';
  document.querySelector('#planta-especie').value = plantaEditar?.nombre_cientifico || '';
  document.querySelector('#planta-categoria').value = plantaEditar?.categoria || 'interior';
  document.querySelector('#planta-frecuencia').value = plantaEditar?.frecuencia_riego_dias || 7;
  document.querySelector('#planta-notas').value = plantaEditar?.notas || '';
  actualizarPreview(null);
  modalPlanta.classList.remove('oculto');
  document.querySelector('#planta-nombre').focus();
}

export function cerrarModalPlanta() {
  if (!modalPlanta) return;
  modalPlanta.classList.add('oculto');
  modalPlanta.classList.remove('modal-planta-fullscreen');
  document.querySelector('#vista-app')?.classList.remove('modal-planta-activa');
  const volverA = modalPantallaCompleta;
  const rutaRegreso = rutaRegresoModal;
  const pestanaRegreso = pestanaRegresoModal;
  modalPantallaCompleta = false;
  errorPlanta.textContent = '';
  formPlanta.reset();
  document.querySelector('#planta-id').value = '';
  fotoSeleccionada = null;
  actualizarPreview(null);
  if (volverA) contextoModal.navegarA(rutaRegreso, pestanaRegreso);
}

function actualizarPreview(archivo) {
  if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl);
  fotoPreviewUrl = null;
  fotoPreview.replaceChildren();
  if (!archivo) {
    fotoPreview.hidden = true;
    return;
  }
  fotoPreviewUrl = URL.createObjectURL(archivo);
  const imagen = document.createElement('img');
  imagen.src = fotoPreviewUrl;
  imagen.alt = contextoModal.tApp('plantPhoto');
  fotoPreview.append(imagen);
  fotoPreview.hidden = false;
}

export function inicializarModalPlanta(contexto) {
  contextoModal = contexto;
  modalPlanta = document.querySelector('#modal-planta');
  formPlanta = document.querySelector('#form-planta');
  errorPlanta = document.querySelector('#error-planta');
  botonGuardarPlanta = document.querySelector('#btn-guardar-planta');
  const nombreCientifico = document.querySelector('#planta-nombre');
  const nombrePersonalizado = document.querySelector('#planta-especie');
  nombreCientifico.maxLength = 150;
  nombreCientifico.placeholder = 'Ej. Monstera deliciosa';
  nombreCientifico.closest('label')?.querySelector('span') && (nombreCientifico.closest('label').querySelector('span').textContent = 'Nombre científico');
  if (nombrePersonalizado) {
    nombrePersonalizado.closest('label').hidden = true;
  }
  const listaEspecies = document.createElement('datalist');
  listaEspecies.id = 'catalogo-especies';
  listaEspecies.innerHTML = catalogoEspecies.map((especie) => `<option value="${especie.cientifico}">${especie.nombre} · ${especie.riego} días</option>`).join('');
  nombreCientifico.setAttribute('list', listaEspecies.id);
  nombreCientifico.after(listaEspecies);
  fotoPreview = document.querySelector('#planta-foto-preview');
  if (!fotoPreview) {
    fotoPreview = document.createElement('span');
    fotoPreview.id = 'planta-foto-preview';
    fotoPreview.className = 'photo-preview';
    fotoPreview.hidden = true;
    document.querySelector('#planta-foto').insertAdjacentElement('afterend', fotoPreview);
  }
  let idInput = document.querySelector('#planta-id');
  if (!idInput) {
    idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.id = 'planta-id';
    formPlanta.prepend(idInput);
  }
  contexto.abrirModalPlanta = abrirModalPlanta;
  contexto.cerrarModalPlanta = cerrarModalPlanta;

  const flecha = document.createElement('button');
  flecha.id = 'btn-volver-planta';
  flecha.type = 'button';
  flecha.className = 'text-action modal-back-arrow';
  flecha.setAttribute('aria-label', 'Volver al inicio');
  flecha.title = 'Volver al inicio';
  flecha.textContent = '←';
  document.querySelector('#modal-planta .modal-heading')?.prepend(flecha);

  document.querySelector('#btn-cerrar-modal')?.remove();
  flecha.addEventListener('click', cerrarModalPlanta);
  document.querySelector('#btn-cancelar-modal')?.addEventListener('click', cerrarModalPlanta);
  modalPlanta?.addEventListener('click', (evento) => {
    if (evento.target === modalPlanta) cerrarModalPlanta();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modalPlanta.classList.contains('oculto')) cerrarModalPlanta();
  });
  document.querySelector('#planta-foto')?.addEventListener('change', (evento) => {
    fotoSeleccionada = evento.target.files?.[0] || null;
    actualizarPreview(fotoSeleccionada);
  });

  nombreCientifico.addEventListener('input', () => {
    const especie = buscarEspeciePorNombre(nombreCientifico.value);
    if (!especie) return;
    if (especie.categoria !== 'otras') document.querySelector('#planta-categoria').value = especie.categoria;
    document.querySelector('#planta-frecuencia').value = especie.riego;
  });

  formPlanta?.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Enter' || evento.target.matches('textarea, button')) return;
    evento.preventDefault();
    const campos = [...formPlanta.querySelectorAll('input:not([type="hidden"]), select, textarea, button')]
      .filter((campo) => !campo.disabled && !campo.hidden);
    const indice = campos.indexOf(evento.target);
    const siguiente = campos.slice(indice + 1).find((campo) => campo.type !== 'submit');
    siguiente?.focus();
  });

  formPlanta?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!formPlanta.reportValidity()) return;
    botonGuardarPlanta.disabled = true;
    botonGuardarPlanta.textContent = contexto.tApp('saving');
    errorPlanta.textContent = '';
    try {
      const id = document.querySelector('#planta-id').value || undefined;
      const nombre = limpiarEntrada(document.querySelector('#planta-nombre'));
      const especie = buscarEspeciePorNombre(nombre);
      const planta = {
        ...(id ? { id } : {}),
        nombre,
        nombre_cientifico: nombre,
        categoria: especie?.categoria !== 'otras' ? especie.categoria : document.querySelector('#planta-categoria').value,
        frecuencia_riego_dias: especie?.riego || Number(document.querySelector('#planta-frecuencia').value),
        notas: limpiarEntrada(document.querySelector('#planta-notas')) || null,
      };
      await contexto.guardarPlanta(planta, fotoSeleccionada);
      cerrarModalPlanta();
      await contexto.cargarJardin();
    } catch (error) {
      errorPlanta.textContent = contexto.tApp('savePlantError', { error: error.message || 'Error desconocido' });
    } finally {
      botonGuardarPlanta.disabled = false;
      botonGuardarPlanta.textContent = contexto.tApp('savePlant');
    }
  });
}

