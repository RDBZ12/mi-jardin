export function inicializarBarraInferior() {
  const barra = document.querySelector('.app-nav');
  if (!barra) return;
  // El navbar debe permanecer anclado al viewport del PWA aunque aparezca el teclado.
  barra.style.setProperty('--keyboard-offset', '0px');
}
