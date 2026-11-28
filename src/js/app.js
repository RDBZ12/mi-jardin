import './paginas/montarVistas.js';
import { inicializarPerfil, cargarPerfil } from './paginas/perfil.js';
import { idiomaApp, tApp, traducirDashboard, establecerIdiomaActual, traduccionCategoria, traduccionLuz, traduccionTipo, traduccionRepeticion } from './utils/idiomas.js';
import { inicializarInicio, renderizarInicio } from './paginas/inicio.js';
import { inicializarRiego, renderizarRiego } from './paginas/riego.js';
import { inicializarRecordatorios, renderizarRecordatorios } from './paginas/recordatorios.js';
import { inicializarHistorial, renderizarHistorial } from './paginas/historial.js';
import { inicializarIdentificar, renderizarIdentificar } from './paginas/identificar.js';
import { inicializarMenu, renderizarMenu } from './paginas/menu.js';
import { inicializarPlantas, renderizarPlantas } from './paginas/plantas.js';
import { comprobarConexionServicio, supabase } from './supabase.js';
import { estaRestableciendoContrasena, inicializarAutenticacion, limpiarFormulariosAuth } from './paginas/autenticacion.js';
import { guardarPlanta, obtenerUrlFoto, liberarUrlsFotoLocal } from './servicios/plantas.js';
import { cargarEstadoJardin } from './servicios/estadoJardin.js';

import { fechaProximoRiego, formatearFecha } from './utils/fechas.js';
import { crearElemento, mostrarVacio } from './utils/dom.js';
import { inicializarModalPlanta } from './componentes/modalPlanta.js';
import { inicializarTema, aplicarTema } from './utils/tema.js';
import { inicializarAccesibilidad } from './utils/accesibilidad.js';
import { inicializarCamposClave, actualizarEtiquetasCamposClave } from './componentes/campoClave.js';
import { inicializarBarraInferior } from './utils/teclado.js';
import {
  guardarSesionOffline,
  obtenerSesionOffline,
  limpiarSesionOffline,
  sincronizarPendientes,
} from './servicios/sincronizador.js';

inicializarTema();

const vistaAuth = document.querySelector('#vista-auth');
const vistaApp = document.querySelector('#vista-app');
const listaPlantas = document.querySelector('#lista-plantas');
const mensajeDashboard = document.querySelector('#dashboard-message');
const estadoConexion = document.querySelector('#connection-status');
const paginas = [...document.querySelectorAll('[data-pagina]')];
const botonesNavegacion = [...document.querySelectorAll('.app-nav [data-ruta]')];
const inicioPlantas = document.querySelector('#inicio-plantas');



let usuarioActualId = null;
let restaurandoSesionLocal = false;
let servicioDisponible = navigator.onLine;
let revisionConexion = 0;
let comprobacionConexionEnCurso = false;
let cargaActual = 0;
let plantasActuales = [];
const rutasPersistibles = new Set(['inicio', 'plantas', 'riego', 'identificar', 'historial', 'recordatorios', 'menu']);
const rutaGuardada = localStorage.getItem('mi-jardin-vista-activa');
let vistaActual = rutasPersistibles.has(rutaGuardada) ? rutaGuardada : 'inicio';
let pestanaActiva = rutaGuardada === 'identificar' || rutaGuardada === 'historial' ? 'menu' : vistaActual;



function mostrarMensajeDashboard(texto, esError = false) {
  mensajeDashboard.textContent = texto;
  if (esError) mensajeDashboard.dataset.error = 'true';
  else mensajeDashboard.removeAttribute('data-error');
}

function actualizarResumenPerfil() {
  const cantidad = document.querySelector('#perfil-plantas-cantidad');
  const estado = document.querySelector('#perfil-sync-estado');
  if (cantidad) cantidad.textContent = String(plantasActuales.length);
  if (estado) estado.textContent = navigator.onLine && servicioDisponible
    ? tApp('onlineSyncText')
    : tApp('offlineSyncText');
}

function actualizarEstadoConexion({ pendientes = false } = {}) {
  const sinConexion = !navigator.onLine || !servicioDisponible;
  estadoConexion.textContent = sinConexion
    ? tApp('noConnectionSaved')
    : pendientes ? tApp('onlinePending') : tApp('online');
  estadoConexion.dataset.offline = String(sinConexion);
  estadoConexion.dataset.pending = String(pendientes);
  actualizarResumenPerfil();
}

async function revisarConexionServicio() {
  if (comprobacionConexionEnCurso) return servicioDisponible;
  comprobacionConexionEnCurso = true;
  const revision = ++revisionConexion;
  try {
    const disponible = await comprobarConexionServicio();
    if (revision !== revisionConexion) return servicioDisponible;
    servicioDisponible = disponible;
    actualizarEstadoConexion();
    return disponible;
  } finally {
    comprobacionConexionEnCurso = false;
  }
}

function asegurarEntradaDashboard() {
  if (window.location.hash === '#jardin' && window.history.state?.vista === 'app') return;
  window.history.pushState(
    { ...(window.history.state || {}), vista: 'app' },
    '',
    `${window.location.pathname}${window.location.search}#jardin`,
  );
}

function mostrarLogin() {
  document.documentElement.classList.remove('has-saved-user');
  cargaActual += 1;
  limpiarFormulariosAuth();
  vistaAuth.classList.remove('oculto');
  vistaApp.classList.add('oculto');
  listaPlantas.replaceChildren();
  plantasActuales = [];
  if (window.location.hash === '#jardin') {
    window.history.replaceState({ vista: 'auth' }, '', `${window.location.pathname}${window.location.search}`);
  }
}

function mostrarApp(usuario, offline = !navigator.onLine) {
  document.documentElement.classList.remove('has-saved-user');
  limpiarFormulariosAuth();
  asegurarEntradaDashboard();
  vistaAuth.classList.add('oculto');
  vistaApp.classList.remove('oculto');
  traducirDashboard();
  cambiarVista(vistaActual, pestanaActiva);
  actualizarEstadoConexion();
  if (offline) document.querySelector('#dashboard-message').textContent = tApp('offlineDashboard');
  void cargarJardin();
}

document.addEventListener('mi-jardin-language-change', (evento) => {
  establecerIdiomaActual(evento.detail?.language);
  actualizarEtiquetasCamposClave({ mostrar: tApp('showPassword'), ocultar: tApp('hidePassword') });
  traducirDashboard();
  actualizarEstadoConexion();
  actualizarResumenPerfil();
  if (vistaApp && !vistaApp.classList.contains('oculto')) cambiarVista(vistaActual, pestanaActiva);
});

document.addEventListener('mi-jardin-theme-change', (evento) => {
  if (['light', 'dark', 'system'].includes(evento.detail?.theme)) aplicarTema(evento.detail.theme);
});

const contexto = {
  obtenerEstado: () => ({ plantas: plantasActuales, usuario: usuarioActualId, servicioDisponible, vistaActual }),
  obtenerIdioma: () => idiomaApp,
  cargarJardin,
  navegarA: (ruta, pestana) => cambiarVista(ruta, pestana),
  mostrarMensaje: mostrarMensajeDashboard,
  tApp,
  crearElemento,
  formatoFecha,
  tarjetasPara,
  calcularEstadoRiego,
  traduccionCategoria,
  traduccionLuz,
  traduccionTipo,
  traduccionRepeticion,
  mostrarVacio,
  guardarPlanta,
  cargarPerfil: () => cargarPerfil(contexto),
  supabase,
  actualizarResumenPerfil,
  obtenerSesionOffline,
  cerrarSesion,
  renderizarHistorial: () => renderizarHistorial(contexto),
  onSincronizarManual: async () => {
    if (!servicioDisponible || !supabase) throw new Error(tApp('offlineSyncText'));
    const resultado = await sincronizarPendientes(usuarioActualId, cargarJardin);
    if (resultado.error) throw resultado.error;
    if (resultado.pendientes > 0) {
      throw new Error(`Quedan ${resultado.pendientes} cambios pendientes de sincronizar.`);
    }
    await cargarJardin();
    actualizarResumenPerfil();
    return resultado;
  },
};
inicializarAutenticacion(contexto);
inicializarPerfil(contexto);
inicializarCamposClave();
inicializarModalPlanta(contexto);
inicializarPlantas(contexto);
inicializarInicio(contexto);
inicializarRiego(contexto);
inicializarRecordatorios(contexto);
inicializarHistorial(contexto);
inicializarIdentificar(contexto);
inicializarMenu(contexto);
inicializarAccesibilidad();
inicializarBarraInferior();

function cambiarVista(nombre, pestaña = nombre) {
  const modalAbierto = document.querySelector('#modal-planta:not(.oculto)');
  if (modalAbierto) contexto.cerrarModalPlanta?.();
  if (!rutasPersistibles.has(nombre) && nombre !== 'detalle') nombre = 'inicio';
  vistaActual = nombre;
  pestanaActiva = pestaña;
  // El detalle necesita una planta elegida: al recargar se vuelve a la lista.
  localStorage.setItem('mi-jardin-vista-activa', nombre === 'detalle' ? 'plantas' : nombre);
  for (const pagina of paginas) pagina.classList.toggle('oculto', pagina.dataset.pagina !== nombre);
  for (const boton of botonesNavegacion) {
    const activo = boton.dataset.ruta === pestaña;
    boton.classList.toggle('activo', activo);
    if (activo) boton.setAttribute('aria-current', 'page');
    else boton.removeAttribute('aria-current');
  }

  if (nombre === 'inicio') renderizarInicio(contexto);
  if (nombre === 'plantas') renderizarPlantas(contexto);
  if (nombre === 'riego') renderizarRiego(contexto);
  if (nombre === 'historial') void renderizarHistorial(contexto);
  if (nombre === 'recordatorios') void renderizarRecordatorios(contexto);
  if (nombre === 'menu') void renderizarMenu(contexto);
  if (nombre === 'identificar') renderizarIdentificar(contexto);
}

function calcularEstadoRiego(planta) {
  const proximo = fechaProximoRiego(planta);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((proximo.getTime() - hoy.getTime()) / 86400000);

  if (dias < 0) return { texto: tApp('overdueWater', { days: Math.abs(dias) }), clase: 'badge-atrasado' };
  if (dias === 0) return { texto: tApp('waterToday'), clase: 'badge-hoy' };
  return { texto: tApp('nextWater', { days: dias }), clase: 'badge-ok' };
}

function formatoFecha(valor, incluirHora = false) {
  return formatearFecha(valor, idiomaApp, incluirHora, tApp('dateMissing'));
}

async function tarjetasPara(plantas) {
  return Promise.all(plantas.map(async (planta) => ({
    planta,
    urlFoto: await obtenerUrlFoto(planta),
  })));
}

async function cargarJardin() {
  const carga = ++cargaActual;
  liberarUrlsFotoLocal();
  inicioPlantas.replaceChildren();
  document.querySelector('#lista-plantas').replaceChildren();
  mostrarMensajeDashboard(tApp('loadingPlants'));

  try {
    const plantasCargadas = await cargarEstadoJardin();
    // Una carga vieja que termina tarde no debe pisar los datos de una más reciente.
    if (carga !== cargaActual || vistaApp.classList.contains('oculto')) return;
    plantasActuales = plantasCargadas;

    actualizarResumenPerfil();
    mostrarMensajeDashboard('');
    renderizarInicio(contexto);
    renderizarPlantas(contexto);
    renderizarRiego(contexto);
    contexto.actualizarOpcionesRecordatorio();
  } catch (error) {
    if (carga !== cargaActual) return;
    mostrarMensajeDashboard(tApp('loadPlantsError', { error: error.message }), true);
    document.querySelector('#plants-message').textContent = error.message;
  }
}

async function cerrarSesion() {
  if (!supabase) {
    limpiarSesionOffline();
    vistaActual = 'inicio';
    pestanaActiva = 'inicio';
    localStorage.setItem('mi-jardin-vista-activa', 'inicio');
    mostrarLogin();
    return;
  }
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    mostrarMensajeDashboard(`No se pudo cerrar sesión: ${error.message}`, true);
    return;
  }
  limpiarSesionOffline();
  vistaActual = 'inicio';
  pestanaActiva = 'inicio';
  localStorage.setItem('mi-jardin-vista-activa', 'inicio');
}
document.querySelector('#perfil-cerrar-sesion').addEventListener('click', () => {
  void cerrarSesion();
});

document.querySelectorAll('[data-ir-a]').forEach((boton) => boton.addEventListener('click', () => cambiarVista(boton.dataset.irA)));
botonesNavegacion.forEach((boton) => boton.addEventListener('click', () => cambiarVista(boton.dataset.ruta)));
async function activarSesion(user, offline = false) {
  usuarioActualId = user.id;
  if (!offline) guardarSesionOffline(user);
  mostrarApp(user, offline);

  if (navigator.onLine && !offline) {
    actualizarEstadoConexion({ pendientes: true });
    const resultado = await sincronizarPendientes(user.id, cargarJardin);
    actualizarEstadoConexion({ pendientes: resultado.pendientes > 0 });
    await cargarJardin();
  }
}

const usuarioGuardadoInicio = obtenerSesionOffline();
if (usuarioGuardadoInicio) {
  usuarioActualId = usuarioGuardadoInicio.id;
  restaurandoSesionLocal = true;
  servicioDisponible = false;
  mostrarApp(usuarioGuardadoInicio, true);
}

if (supabase) {
  supabase.auth.onAuthStateChange((evento, session) => {
    window.setTimeout(async () => {
      if (session?.user) {
        if (estaRestableciendoContrasena()) {
          return;
        }
        const cambioUsuario = usuarioActualId !== session.user.id;
        if (cambioUsuario || vistaApp.classList.contains('oculto') || restaurandoSesionLocal) {
          restaurandoSesionLocal = false;
          await activarSesion(session.user, !navigator.onLine);
        } else {
          guardarSesionOffline(session.user);
          asegurarEntradaDashboard();
        }
        return;
      }

      if (evento === 'INITIAL_SESSION') {
        const usuarioOffline = obtenerSesionOffline();
        if (usuarioOffline) {
          servicioDisponible = false;
          usuarioActualId = usuarioOffline.id;
          if (vistaApp.classList.contains('oculto')) mostrarApp(usuarioOffline, true);
          return;
        }
      }

      if (evento === 'SIGNED_OUT') limpiarSesionOffline();
      usuarioActualId = null;
      mostrarLogin();
    }, 0);
  });
} else {
  mostrarLogin();
}

window.addEventListener('popstate', async () => {
  if (estaRestableciendoContrasena()) {
    window.history.pushState({ vista: 'restablecer-contrasena' }, '', window.location.href);
    return;
  }

  if (!supabase) {
    mostrarLogin();
    return;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user) {
      await activarSesion(data.session.user, !navigator.onLine);
      return;
    }
  } catch (error) {
    if (navigator.onLine) console.warn('No se pudo comprobar la sesión al volver atrás:', error);
  }

  const usuarioOffline = !navigator.onLine ? obtenerSesionOffline() : null;
  if (usuarioOffline) {
    await activarSesion(usuarioOffline, true);
    return;
  }

  usuarioActualId = null;
  limpiarSesionOffline();
  mostrarLogin();
});

window.addEventListener('online', async () => {
  servicioDisponible = true;
  actualizarEstadoConexion({ pendientes: true });
  if (!await revisarConexionServicio()) return;
  if (!supabase) return;

  const { data, error } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (error || !user || user.id !== usuarioActualId) {
    actualizarEstadoConexion({ pendientes: true });
    mostrarMensajeDashboard('Vuelve a iniciar sesión para sincronizar los cambios pendientes.', true);
    return;
  }

  guardarSesionOffline(user);
  actualizarEstadoConexion({ pendientes: true });
  const resultado = await sincronizarPendientes(user.id);
  await cargarJardin();
  if (vistaActual === 'historial') await renderizarHistorial(contexto);
  if (vistaActual === 'recordatorios') await renderizarRecordatorios(contexto);
  actualizarEstadoConexion({ pendientes: resultado.pendientes > 0 });
});

async function actualizarAlVolverAlaApp() {
  if (document.visibilityState === 'hidden' || !usuarioActualId || !supabase || !navigator.onLine) return;
  if (!await revisarConexionServicio()) return;
  await sincronizarPendientes(usuarioActualId);
  await cargarJardin();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void actualizarAlVolverAlaApp();
});
window.addEventListener('focus', () => void actualizarAlVolverAlaApp());

window.addEventListener('offline', () => {
  servicioDisponible = false;
  revisionConexion += 1;
  actualizarEstadoConexion();
});

void revisarConexionServicio();
window.setInterval(() => { void revisarConexionServicio(); }, 2000);
