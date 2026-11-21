export const vistaIdentificar = "<section class=\"app-page oculto\" id=\"pagina-identificar\" data-pagina=\"identificar\">\n          <button class=\"text-action back-action menu-back-arrow\" type=\"button\" data-volver-menu data-i18n-aria-label=\"volver\" aria-label=\"Volver al menú\" title=\"Volver al menú\"><span aria-hidden=\"true\">←</span></button>\n          <div class=\"plants-heading\"><div><p class=\"section-eyebrow\">CATÁLOGO GUIADO</p><h1>Identificar planta</h1></div></div>\n          <p class=\"page-intro\">Compara tu planta con el catálogo y elige la especie que más se parece. La identificación automática aún no está conectada.</p>\n          <label class=\"form-field\" for=\"identify-photo\"><span>Foto de la planta</span><input id=\"identify-photo\" type=\"file\" accept=\"image/*\" capture=\"environment\" /></label>\n          <img class=\"identify-preview oculto\" id=\"identify-preview\" alt=\"Vista previa de la planta\" />\n          <label class=\"search-field\"><span class=\"sr-only\">Buscar especies</span><input id=\"species-search\" type=\"search\" placeholder=\"Buscar especie\" /></label>\n          <div class=\"species-list\" id=\"species-list\"></div>\n          <section class=\"species-detail oculto\" id=\"species-detail\" aria-live=\"polite\">\n            <h2 id=\"species-title\"></h2><p id=\"species-description\"></p><dl id=\"species-care\"></dl>\n            <label class=\"form-field\" for=\"identify-name\"><span>Nombre para tu planta <span class=\"optional\">(opcional)</span></span><input id=\"identify-name\" maxlength=\"100\" /></label>\n            <button class=\"button-primary\" id=\"identify-save\" type=\"button\">Guardar en mis plantas</button>\n          </section>\n          <p class=\"form-error\" id=\"identify-error\" role=\"alert\"></p>\n        </section>";
import { guardarPlanta } from '../servicios/plantas.js';
import { crearElemento, limpiarEntrada } from '../utils/dom.js';

const catalogoEspecies = [
  { nombre: 'Rosa', cientifico: 'Rosa spp.', categoria: 'ornamentales', descripcion: 'Planta ornamental apreciada por sus flores aromáticas.', luz: 'alta', riego: 4, temperatura: '18 - 28 °C', humedad: 'Media - alta', cuidados: 'Poda las flores marchitas y mantén el sustrato ligeramente húmedo.' },
  { nombre: 'Girasol', cientifico: 'Helianthus annuus', categoria: 'exterior', descripcion: 'Planta de gran altura y flores solares.', luz: 'luz_directa', riego: 5, temperatura: '18 - 30 °C', humedad: 'Media', cuidados: 'Requiere sol constante y riego moderado.' },
  { nombre: 'Aloe Vera', cientifico: 'Aloe vera', categoria: 'suculentas', descripcion: 'Planta resistente para interiores luminosos.', luz: 'alta', riego: 14, temperatura: '18 - 30 °C', humedad: 'Baja - media', cuidados: 'Deja secar el sustrato entre riegos.' },
  { nombre: 'Cactus', cientifico: 'Cactaceae', categoria: 'cactus', descripcion: 'Planta xerófila ideal para ambientes secos.', luz: 'luz_directa', riego: 21, temperatura: '20 - 32 °C', humedad: 'Baja', cuidados: 'Riego espaciado y drenaje excelente.' },
  { nombre: 'Monstera', cientifico: 'Monstera deliciosa', categoria: 'interior', descripcion: 'Planta tropical de hojas grandes y vistosas.', luz: 'alta', riego: 7, temperatura: '18 - 30 °C', humedad: 'Media - alta', cuidados: 'Mantén humedad y un soporte para trepar.' },
  { nombre: 'Pothos', cientifico: 'Epipremnum aureum', categoria: 'interior', descripcion: 'Planta colgante fácil de cuidar.', luz: 'media', riego: 7, temperatura: '15 - 30 °C', humedad: 'Media', cuidados: 'Evita el exceso de agua y limpia sus hojas.' },
  { nombre: 'Sansevieria', cientifico: 'Dracaena trifasciata', categoria: 'interior', descripcion: 'Planta muy resistente, adaptada a condiciones secas.', luz: 'baja', riego: 14, temperatura: '18 - 32 °C', humedad: 'Baja - media', cuidados: 'Riego ocasional y poca humedad.' },
  { nombre: 'Orquídea', cientifico: 'Orchidaceae', categoria: 'interior', descripcion: 'Planta que requiere humedad y luz suave.', luz: 'alta', riego: 7, temperatura: '18 - 26 °C', humedad: 'Alta', cuidados: 'Cuida la humedad ambiental y el drenaje.' },
  { nombre: 'Planta de café', cientifico: 'Coffea arabica', categoria: 'interior', descripcion: 'Planta para un ambiente cálido y luminoso.', luz: 'alta', riego: 5, temperatura: '18 - 27 °C', humedad: 'Media - alta', cuidados: 'Mantén el suelo húmedo, pero no encharcado.' },
  { nombre: 'Lavanda', cientifico: 'Lavandula angustifolia', categoria: 'aromaticas', descripcion: 'Planta aromática apreciada por sus flores y fragancia.', luz: 'luz_directa', riego: 6, temperatura: '15 - 25 °C', humedad: 'Baja - media', cuidados: 'Requiere buen drenaje y suelo ligero.' },
];
let especieSeleccionada = null;
let fotoIdentificacion = null;

export function renderizarIdentificar(contexto) {
  const termino = limpiarEntrada(document.querySelector('#species-search')).toLocaleLowerCase(contexto.obtenerIdioma());
  const lista = document.querySelector('#species-list');
  const especies = catalogoEspecies.filter((especie) => `${especie.nombre} ${especie.cientifico}`.toLocaleLowerCase('es').includes(termino));
  const botones = especies.map((especie) => {
    const boton = crearElemento('button', `species-option${especie === especieSeleccionada ? ' activo' : ''}`);
    boton.type = 'button';
    boton.append(crearElemento('strong', '', especie.nombre), crearElemento('span', '', especie.cientifico));
    boton.addEventListener('click', () => seleccionarEspecie(especie, contexto));
    return boton;
  });
  if (botones.length) lista.replaceChildren(...botones);
  else contexto.mostrarVacio(lista, contexto.tApp('noSpecies'));
}

function seleccionarEspecie(especie, contexto) {
  especieSeleccionada = especie;
  document.querySelector('#species-detail').classList.remove('oculto');
  document.querySelector('#species-title').textContent = `${especie.nombre} · ${especie.cientifico}`;
  document.querySelector('#species-description').textContent = especie.descripcion;
  const cuidados = document.querySelector('#species-care');
  const datos = [
    [contexto.tApp('light'), contexto.traduccionLuz(especie.luz)],
    [contexto.tApp('watering'), contexto.tApp('wateringIn', { days: especie.riego })],
    [contexto.tApp('temperature'), especie.temperatura],
    [contexto.tApp('humidity'), especie.humedad],
    [contexto.tApp('care'), especie.cuidados],
  ];
  cuidados.replaceChildren(...datos.flatMap(([label, valor]) => [crearElemento('dt', '', label), crearElemento('dd', '', valor)]));
  renderizarIdentificar(contexto);
}

function mapearNecesidadLuz(valor) {
  if (valor === 'luz_directa') return 'luz_directa';
  if (valor === 'baja' || valor === 'media' || valor === 'alta') return valor;
  return null;
}

function mapearTemperatura(valor) {
  const numeros = [...valor.matchAll(/-?\d+(?:[.,]\d+)?/g)].map((match) => Number(match[0].replace(',', '.')));
  return { temperatura_min_c: numeros[0] ?? null, temperatura_max_c: numeros[1] ?? numeros[0] ?? null };
}

export function inicializarIdentificar(contexto) {
  document.querySelector('#species-search').addEventListener('input', () => renderizarIdentificar(contexto));
  document.querySelector('#identify-photo').addEventListener('change', (evento) => {
    fotoIdentificacion = evento.target.files[0] || null;
    const preview = document.querySelector('#identify-preview');
    if (preview.dataset.url) URL.revokeObjectURL(preview.dataset.url);
    if (!fotoIdentificacion) {
      preview.classList.add('oculto');
      preview.removeAttribute('src');
      return;
    }
    const url = URL.createObjectURL(fotoIdentificacion);
    preview.dataset.url = url;
    preview.src = url;
    preview.classList.remove('oculto');
  });
  document.querySelector('#identify-save').addEventListener('click', async () => {
    const error = document.querySelector('#identify-error');
    error.textContent = '';
    if (!especieSeleccionada || !fotoIdentificacion) {
      error.textContent = contexto.tApp('selectSpeciesAndPhoto');
      return;
    }
    const boton = document.querySelector('#identify-save');
    boton.disabled = true;
    try {
      const especie = especieSeleccionada;
      const temperaturas = mapearTemperatura(especie.temperatura);
      await guardarPlanta({
        nombre: limpiarEntrada(document.querySelector('#identify-name')) || especie.nombre,
        nombre_cientifico: especie.cientifico,
        categoria: especie.categoria,
        frecuencia_riego_dias: especie.riego,
        necesidad_luz: mapearNecesidadLuz(especie.luz),
        ...temperaturas,
        notas: `Humedad: ${especie.humedad}. ${especie.cuidados}`,
        descripcion: especie.descripcion,
      }, fotoIdentificacion);
      fotoIdentificacion = null;
      especieSeleccionada = null;
      document.querySelector('#identify-photo').value = '';
      document.querySelector('#identify-name').value = '';
      document.querySelector('#identify-preview').classList.add('oculto');
      document.querySelector('#species-detail').classList.add('oculto');
      contexto.navegarA('plantas');
      await contexto.cargarJardin();
    } catch (errorGuardar) {
      error.textContent = contexto.tApp('savePlantError', { error: errorGuardar.message });
    } finally {
      boton.disabled = false;
    }
  });
}
