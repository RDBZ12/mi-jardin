export function inicializarBarraInferior() {
  const barra = document.querySelector('.app-nav');
  if (!barra) return;
  // El navbar debe permanecer anclado al viewport del PWA aunque aparezca el teclado.
  barra.style.setProperty('--keyboard-offset', '0px');
  const app = document.querySelector('#vista-app');
  const actualizarEstadoTeclado = () => {
    const activo = document.activeElement;
    app?.classList.toggle('teclado-abierto', Boolean(activo?.matches('input, select, textarea')));
  };
  document.addEventListener('focusin', actualizarEstadoTeclado);
  document.addEventListener('focusout', () => window.setTimeout(actualizarEstadoTeclado, 120));
}
