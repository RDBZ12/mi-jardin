const TEMAS_VALIDOS = new Set(['light', 'dark', 'system']);
const CLAVE_TEMA = 'mi-jardin-theme-preference';

export function obtenerPreferenciaTema() {
  const guardado = localStorage.getItem(CLAVE_TEMA);
  return TEMAS_VALIDOS.has(guardado) ? guardado : 'light';
}

export function resolverTema(preferencia = obtenerPreferenciaTema()) {
  if (preferencia === 'system') return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return preferencia === 'dark' ? 'dark' : 'light';
}

export function aplicarTema(preferencia = obtenerPreferenciaTema()) {
  const valor = TEMAS_VALIDOS.has(preferencia) ? preferencia : 'light';
  const tema = resolverTema(valor);
  localStorage.setItem(CLAVE_TEMA, valor);
  document.documentElement.dataset.theme = tema;
  if (document.body) document.body.dataset.theme = tema;
  document.querySelectorAll('[data-theme-choice]').forEach((boton) => {
    const activo = boton.dataset.themeChoice === valor;
    boton.setAttribute('aria-checked', String(activo));
    boton.classList.toggle('seleccionado', activo);
  });
  document.dispatchEvent(new CustomEvent('mi-jardin-theme-applied', { detail: { preference: valor, theme: tema } }));
  return tema;
}

export function alternarTema() {
  return aplicarTema(resolverTema() === 'dark' ? 'light' : 'dark');
}

export function inicializarTema() {
  aplicarTema();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (obtenerPreferenciaTema() === 'system') aplicarTema('system');
  });
}
