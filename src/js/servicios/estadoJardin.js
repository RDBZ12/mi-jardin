import { obtenerPlantas } from './plantas.js';

// Mantiene la carga del estado persistido dentro de servicios; IndexedDB y
// la combinación con la cola offline siguen siendo responsabilidad de plantas.js.
export async function cargarEstadoJardin() {
  return obtenerPlantas();
}
