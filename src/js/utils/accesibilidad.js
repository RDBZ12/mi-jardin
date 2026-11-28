import { reproducirTono } from '../servicios/sonidos.js';

const CLAVE = 'mi-jardin-accesibilidad';
const POR_DEFECTO = Object.freeze({ brillo: 100, fuente: 'estandar', tamano: 'normal', negrita: false, contraste: false, sonido: true, narrador: false });
const FUENTES = { estandar: "'Inter Variable', Inter, sans-serif", legible: "Arial, Helvetica, sans-serif", espaciada: "'OpenDyslexic', 'Inter Variable', Inter, sans-serif" };
let preferencias = { ...POR_DEFECTO };

export function crearTarjetaAccesibilidad() {
  if (document.querySelector('#sub-accesibilidad')) return;
  const fila = document.createElement('button');
  fila.className = 'menu-fila'; fila.type = 'button'; fila.dataset.subvista = 'sub-accesibilidad';
  fila.innerHTML = '<span class="menu-fila-icono" aria-hidden="true">◉</span><span data-i18n="menu_accesibilidad">Accesibilidad</span><span class="menu-fila-flecha" aria-hidden="true">›</span>';
  const listaMenu = document.querySelector('#menu-lista-principal .menu-lista');
  const botonCerrarSesion = listaMenu?.querySelector('#btn-menu-salir');
  if (listaMenu && botonCerrarSesion) listaMenu.insertBefore(fila, botonCerrarSesion);
  else listaMenu?.append(fila);
  const tarjeta = document.createElement('section');
  tarjeta.className = 'profile-card subvista oculto';
  tarjeta.id = 'sub-accesibilidad';
  tarjeta.setAttribute('aria-labelledby', 'a11y-titulo');
  tarjeta.innerHTML = `<button class="text-action back-action menu-back-arrow" type="button" data-volver data-i18n-aria-label="volver" aria-label="Volver al menú"><span aria-hidden="true">←</span></button>
    <h2 id="a11y-titulo" data-i18n="a11y_titulo">Accesibilidad</h2><p class="page-intro" data-i18n="a11y_intro">Personaliza la lectura y la apariencia de la aplicación.</p>
    <div id="a11y-controles"><div class="a11y-control-row"><label for="a11y-brillo" data-i18n="a11y_brillo">Brillo de la interfaz</label><input id="a11y-brillo" data-a11y-control="brillo" type="range" min="60" max="130" step="5" value="100"><output id="a11y-brillo-valor">100%</output><small class="a11y-help" data-i18n="a11y_brillo_ayuda">Ajusta la luminosidad de Mi Jardín. El brillo físico se cambia desde el Centro de control del iPhone.</small></div>
    <div class="a11y-control-row"><label for="a11y-fuente" data-i18n="a11y_fuente">Tipo de letra</label><select id="a11y-fuente" data-a11y-control="fuente"><option value="estandar" data-i18n="a11y_fuente_estandar">Estándar</option><option value="legible" data-i18n="a11y_fuente_legible">Alta legibilidad</option><option value="espaciada" data-i18n="a11y_fuente_espaciada">Espaciada</option></select></div>
    <div class="a11y-control-row"><label for="a11y-tamano" data-i18n="a11y_tamano">Tamaño de letra</label><select id="a11y-tamano" data-a11y-control="tamano"><option value="normal" data-i18n="a11y_normal">Normal</option><option value="grande" data-i18n="a11y_grande">Grande</option><option value="extra" data-i18n="a11y_extra">Extra grande</option></select></div>
    <label class="a11y-switch-row"><span data-i18n="a11y_negritas">Negritas</span><input data-a11y-control="negrita" type="checkbox"></label><label class="a11y-switch-row"><span data-i18n="a11y_contraste">Alto contraste</span><input data-a11y-control="contraste" type="checkbox"></label><label class="a11y-switch-row"><span data-i18n="a11y_sonidos">Sonidos</span><input data-a11y-control="sonido" type="checkbox"></label><label class="a11y-switch-row"><span data-i18n="a11y_narrador">Narrador</span><input data-a11y-control="narrador" type="checkbox"></label><button class="button-secondary" id="a11y-sonido-prueba" type="button" data-i18n="a11y_probar_sonido">Probar sonido</button><button class="button-secondary" id="a11y-restablecer" type="button" data-i18n="a11y_restablecer">Restablecer valores</button></div>`;
  document.querySelector('#pagina-perfil')?.append(tarjeta);
}

function leerPreferencias() {
  try { preferencias = { ...POR_DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE) || '{}') }; } catch { preferencias = { ...POR_DEFECTO }; }
  preferencias.brillo = Math.min(130, Math.max(60, Number(preferencias.brillo) || 100));
  return preferencias;
}

function guardar() { localStorage.setItem(CLAVE, JSON.stringify(preferencias)); }

function aplicarVisual() {
  const raiz = document.documentElement;
  const nivelBrillo = preferencias.brillo / 100;
  raiz.style.setProperty('--a11y-brightness', String(nivelBrillo));
  raiz.style.setProperty('--a11y-overlay-color', nivelBrillo < 1 ? '#000' : '#fff');
  raiz.style.setProperty('--a11y-overlay-opacity', String(nivelBrillo < 1 ? 1 - nivelBrillo : Math.min(.24, (nivelBrillo - 1) / nivelBrillo)));
  raiz.style.setProperty('--a11y-font-family', FUENTES[preferencias.fuente] || FUENTES.estandar);
  raiz.dataset.a11yFuente = preferencias.fuente;
  raiz.dataset.a11yTamano = preferencias.tamano;
  raiz.dataset.contraste = preferencias.contraste ? 'alto' : 'normal';
  raiz.classList.toggle('a11y-negrita', preferencias.negrita);
  document.querySelectorAll('[data-a11y-control]').forEach((control) => {
    const clave = control.dataset.a11yControl;
    if (control.type === 'checkbox') control.checked = Boolean(preferencias[clave]);
    else control.value = String(preferencias[clave]);
  });
  const brillo = document.querySelector('#a11y-brillo');
  if (brillo) brillo.addEventListener('input', () => { document.querySelector('#a11y-brillo-valor').textContent = `${brillo.value}%`; });
}

function hablar(texto) {
  if (!preferencias.narrador || !('speechSynthesis' in window) || !texto.trim()) return;
  window.speechSynthesis.cancel();
  const voz = new SpeechSynthesisUtterance(texto.trim());
  voz.lang = document.documentElement.lang === 'en' ? 'en-US' : 'es-ES';
  voz.rate = 0.88;
  voz.pitch = 1;
  voz.volume = 1;
  const idioma = voz.lang.slice(0, 2);
  const voces = window.speechSynthesis.getVoices();
  voz.voice = voces.find((candidata) => candidata.lang?.toLowerCase().startsWith(idioma)) || null;
  window.speechSynthesis.speak(voz);
}

function textoAccesible(elemento) {
  if (elemento.getAttribute('aria-label')) return elemento.getAttribute('aria-label');
  if (elemento.labels?.[0]?.textContent) return elemento.labels[0].textContent;
  return elemento.innerText || elemento.textContent || '';
}

export function obtenerPreferenciasAccesibilidad() { return { ...preferencias }; }

export function inicializarAccesibilidad() {
  leerPreferencias();
  aplicarVisual();
  document.querySelectorAll('[data-a11y-control]').forEach((control) => {
    control.addEventListener('input', () => {
      const clave = control.dataset.a11yControl;
      preferencias[clave] = control.type === 'checkbox' ? control.checked : control.value;
      if (clave === 'brillo') preferencias.brillo = Number(preferencias.brillo);
      guardar(); aplicarVisual();
      if (clave === 'narrador' && preferencias.narrador) hablar(document.documentElement.lang === 'en' ? 'Screen reader enabled' : 'Narrador activado');
    });
  });
  document.querySelector('#a11y-restablecer')?.addEventListener('click', () => { preferencias = { ...POR_DEFECTO }; guardar(); aplicarVisual(); });
  document.querySelector('#a11y-sonido-prueba')?.addEventListener('click', () => { if (preferencias.sonido) reproducirTono('suave'); });
  document.addEventListener('click', (evento) => {
    const objetivo = evento.target.closest('button, a, label, h1, h2, h3');
    if (objetivo && !objetivo.closest('#a11y-controles')) hablar(objetivo.innerText || objetivo.getAttribute('aria-label') || '');
  }, true);
  document.addEventListener('mi-jardin-language-change', () => {
    if (preferencias.narrador) hablar(document.documentElement.lang === 'en' ? 'Language changed to English' : 'Idioma cambiado a español');
  });
  document.addEventListener('focusin', (evento) => {
    const objetivo = evento.target.closest('button, a, input, select, textarea, [role="radio"]');
    if (objetivo) hablar(textoAccesible(objetivo));
  });
}
