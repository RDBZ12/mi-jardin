if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const scriptURL = new URL('./sw.js', window.location.href);
    const scopeURL = new URL('./', window.location.href);
    const yaTeniaControlador = Boolean(navigator.serviceWorker.controller);
    let recargandoTrasActualizacion = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!yaTeniaControlador || recargandoTrasActualizacion) return;
      recargandoTrasActualizacion = true;
      window.location.reload();
    });

    navigator.serviceWorker.register(scriptURL, {
      scope: scopeURL.pathname,
      updateViaCache: 'none'
    }).then((registro) => registro.update())
      .catch((error) => console.warn('No se pudo activar el modo instalable:', error));
  });
}
