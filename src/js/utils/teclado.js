export function inicializarBarraInferior() {
  const barra = document.querySelector('.app-nav');
  const viewport = window.visualViewport;
  if (!barra || !viewport) return;

  const actualizarPosicion = () => {
    const teclado = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    barra.style.setProperty('--keyboard-offset', `${Math.round(teclado)}px`);
  };
  viewport.addEventListener('resize', actualizarPosicion);
  viewport.addEventListener('scroll', actualizarPosicion);
  actualizarPosicion();
}
