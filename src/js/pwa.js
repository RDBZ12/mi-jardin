if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const scriptURL = new URL('./sw.js', window.location.href);
    const scopeURL = new URL('./', window.location.href);
    navigator.serviceWorker.register(scriptURL, { scope: scopeURL.pathname })
      .catch((error) => console.warn('No se pudo activar el modo instalable:', error));
  });
}
