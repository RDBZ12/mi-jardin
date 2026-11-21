const CACHE_NAME = 'mi-jardin-shell-v3';
const APP_ROOT = new URL('./', self.registration.scope);
const SHELL_FILES = ['manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']
  .map((ruta) => new URL(ruta, APP_ROOT).href);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(APP_ROOT.href, { cache: 'reload' });
    if (!response.ok) throw new Error('No se pudo precachear Mi Jardín.');
    const html = await response.clone().text();
    await cache.put(APP_ROOT.href, response);

    // Vite genera rutas relativas para que funcione en GitHub Pages y Capacitor.
    const recursos = [...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css))"/g)]
      .map((match) => new URL(match[1], APP_ROOT).href)
      .filter((ruta) => new URL(ruta).origin === self.location.origin);
    await cache.addAll([...SHELL_FILES, ...recursos]);

    const recursosCss = await Promise.all(recursos
      .filter((ruta) => ruta.endsWith('.css'))
      .map(async (ruta) => {
        const css = await cache.match(ruta);
        if (!css) return [];
        const texto = await css.text();
        return [...texto.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
          .map((match) => new URL(match[1], ruta))
          .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(APP_ROOT.pathname))
          .map((url) => url.href);
      }));
    await cache.addAll(recursosCss.flat());
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres
      .filter((nombre) => nombre.startsWith('mi-jardin-shell-') && nombre !== CACHE_NAME)
      .map((nombre) => caches.delete(nombre)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const appPath = APP_ROOT.pathname;
  const esApi = /\/(?:rest|auth|storage)\/v1\//.test(url.pathname);

  // Network First para documentos HTML y lecturas de API.
  if (request.mode === 'navigate' || esApi) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') {
          await cache.put(request.mode === 'navigate' ? APP_ROOT.href : request, response.clone());
        }
        return response;
      } catch {
        return (await cache.match(request.mode === 'navigate' ? APP_ROOT.href : request))
          || (request.mode === 'navigate' ? await cache.match(new URL('index.html', APP_ROOT).href) : null)
          || Response.error();
      }
    })());
    return;
  }

  // Cache First para bundles, imágenes, fuentes y manifest dentro del scope actual.
  const esEstatico = url.origin === self.location.origin
    && url.pathname.startsWith(appPath)
    && (/\/assets\//.test(url.pathname) || /\/icons\//.test(url.pathname) || url.pathname.endsWith('/manifest.webmanifest'));
  if (!esEstatico) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const guardado = await cache.match(request);
    if (guardado) return guardado;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
