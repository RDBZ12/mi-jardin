const DB_NAME = 'mi_jardin_offline_db';
const DB_VERSION = 1;

let databasePromise;

function abrirDB() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error('Este navegador no permite guardar datos offline.'));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'clave' });
        }
        if (!db.objectStoreNames.contains('cola_sync')) {
          db.createObjectStore('cola_sync', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          databasePromise = undefined;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error || new Error('No se pudo abrir la base offline.'));
      request.onblocked = () => reject(new Error('Cierra otras pestañas de Mi Jardín para actualizar la base offline.'));
    }).catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }

  return databasePromise;
}

function claveCache(usuarioId, coleccion) {
  return `${usuarioId}:${coleccion}`;
}

export async function guardarCacheLocal(usuarioId, coleccion, datos) {
  if (!usuarioId) throw new Error('Se necesita un usuario para guardar la caché.');
  const db = await abrirDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({
      clave: claveCache(usuarioId, coleccion),
      usuarioId,
      coleccion,
      datos,
      actualizado: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('No se pudo guardar la caché offline.'));
    tx.onabort = () => reject(tx.error || new Error('Se canceló el guardado de la caché offline.'));
  });
}

export async function leerCacheLocal(usuarioId, coleccion) {
  if (!usuarioId) return [];
  const db = await abrirDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cache', 'readonly');
    const request = tx.objectStore('cache').get(claveCache(usuarioId, coleccion));
    request.onsuccess = () => resolve(request.result?.datos ?? []);
    request.onerror = () => reject(request.error || new Error('No se pudo leer la caché offline.'));
  });
}

export async function encolarOperacion(usuarioId, operacion) {
  if (!usuarioId) throw new Error('Se necesita un usuario para encolar una operación.');
  const db = await abrirDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cola_sync', 'readwrite');
    const request = tx.objectStore('cola_sync').add({
      usuarioId,
      ...operacion,
      creado: Date.now(),
    });
    let id;
    request.onsuccess = () => { id = request.result; };
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error || new Error('No se pudo guardar la operación pendiente.'));
    tx.onabort = () => reject(tx.error || new Error('Se canceló el guardado de la operación pendiente.'));
  });
}

export async function obtenerColaPendiente(usuarioId) {
  if (!usuarioId) return [];
  const db = await abrirDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cola_sync', 'readonly');
    const request = tx.objectStore('cola_sync').getAll();
    request.onsuccess = () => resolve(
      (request.result ?? [])
        .filter((operacion) => operacion.usuarioId === usuarioId)
        .sort((a, b) => a.id - b.id),
    );
    request.onerror = () => reject(request.error || new Error('No se pudo leer la cola offline.'));
  });
}

export async function eliminarDeCola(id) {
  const db = await abrirDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('cola_sync', 'readwrite');
    tx.objectStore('cola_sync').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('No se pudo confirmar la sincronización.'));
    tx.onabort = () => reject(tx.error || new Error('Se canceló la actualización de la cola offline.'));
  });
}