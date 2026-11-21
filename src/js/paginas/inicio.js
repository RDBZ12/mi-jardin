export const vistaInicio = "<section class=\"app-page\" id=\"pagina-inicio\" data-pagina=\"inicio\">\n          <div class=\"plants-heading\">\n            <div><p class=\"section-eyebrow\">TU ESPACIO VERDE</p><h1>Resumen</h1></div>\n          </div>\n          <p class=\"dashboard-message\" id=\"dashboard-message\" role=\"status\" aria-live=\"polite\"></p>\n          <div class=\"summary-grid\">\n            <article class=\"summary-item\"><span>Plantas</span><strong id=\"dashboard-plant-count\">0</strong></article>\n            <article class=\"summary-item summary-next\"><span>Próximo riego</span><strong id=\"dashboard-next-watering\">—</strong></article>\n          </div>\n          <button class=\"fab-add-plant\" id=\"inicio-nueva-planta\" type=\"button\" aria-label=\"Agregar planta\" title=\"Agregar planta\" data-tooltip=\"Agregar planta\">\n            <span aria-hidden=\"true\">+</span>\n          </button>\n          <div class=\"section-heading\"><h2>Próximos riegos</h2><div class=\"home-actions\"><button class=\"text-action\" type=\"button\" data-ir-a=\"riego\">Registrar riego</button><button class=\"text-action\" type=\"button\" data-ir-a=\"recordatorios\">Recordatorios</button></div></div>\n          <div class=\"upcoming-list\" id=\"upcoming-list\"></div>\n          <p class=\"health-summary\" id=\"dashboard-health-summary\"></p>\n          <div class=\"section-heading home-plants-heading\"><h2>Tu colección</h2><button class=\"text-action\" type=\"button\" data-ir-a=\"plantas\">Ver todas</button></div>\n          <div class=\"grid-plantas grid-inicio\" id=\"inicio-plantas\"></div>\n        </section>";
import { registrarCuidado } from '../servicios/cuidados.js';
import { fechaProximoRiego } from '../utils/fechas.js';
import { crearTarjetaPlanta } from '../componentes/tarjetaPlanta.js';

export function renderizarInicio(contexto) {
  const { plantas } = contexto.obtenerEstado();
  const { tApp, crearElemento, formatoFecha, tarjetasPara } = contexto;
  const usuario = contexto.obtenerSesionOffline?.();
  const nombre = usuario?.user_metadata?.nombre_completo || usuario?.user_metadata?.full_name || usuario?.user_metadata?.username || usuario?.email?.split('@')[0] || 'Mi Jardín';
  const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'MJ';
  const avatar = document.querySelector('#inicio-avatar-usuario');
  if (avatar) { avatar.textContent = iniciales; avatar.setAttribute('aria-label', `Abrir perfil de ${nombre}`); }
  document.querySelector('#dashboard-plant-count').textContent = String(plantas.length);
  const proximos = plantas
    .map((planta) => ({ planta, fecha: fechaProximoRiego(planta) }))
    .sort((a, b) => a.fecha - b.fecha);
  const primerRiego = proximos[0];
  document.querySelector('#dashboard-next-watering').textContent = primerRiego
    ? primerRiego.fecha.toLocaleDateString(contexto.obtenerIdioma(), { day: 'numeric', month: 'short' })
    : '—';

  const listaProximos = document.querySelector('#upcoming-list');
  listaProximos.replaceChildren();
  for (const item of proximos.slice(0, 5)) {
    const fila = crearElemento('div', 'upcoming-row');
    fila.append(crearElemento('strong', '', item.planta.nombre), crearElemento('span', '', formatoFecha(item.fecha)));
    listaProximos.append(fila);
  }
  if (!proximos.length) listaProximos.append(crearElemento('p', 'page-intro', tApp('addPlantForWater')));

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const porRegar = proximos.filter((item) => item.fecha <= hoy).length;
  document.querySelector('#dashboard-health-summary').textContent = plantas.length
    ? `${porRegar} ${tApp('dueToday')} · ${plantas.length - porRegar} ${tApp('upToDate')}.`
    : '';

  void tarjetasPara(plantas.slice(0, 3)).then((tarjetas) => {
    if (contexto.obtenerEstado().vistaActual !== 'inicio') return;
    document.querySelector('#inicio-plantas').replaceChildren(
      ...tarjetas.map(({ planta, urlFoto }) => crearTarjetaPlanta(planta, urlFoto, false, {
        tApp, traduccionCategoria: contexto.traduccionCategoria,
        calcularEstadoRiego: contexto.calcularEstadoRiego,
      })),
    );
  });
}

export function inicializarInicio(contexto) {
  const encabezado = document.querySelector('#pagina-inicio .plants-heading');
  if (encabezado && !document.querySelector('#inicio-avatar-usuario')) {
    const avatar = document.createElement('button');
    avatar.id = 'inicio-avatar-usuario';
    avatar.className = 'avatar-usuario';
    avatar.type = 'button';
    avatar.textContent = 'MJ';
    avatar.setAttribute('aria-label', 'Abrir mi perfil');
    encabezado.append(avatar);
    avatar.addEventListener('click', () => {
      contexto.navegarA('menu', 'menu');
      document.querySelector('[data-subvista="sub-perfil"]')?.click();
    });
  }
  const botonAgregar = document.querySelector('#inicio-nueva-planta');
  botonAgregar?.addEventListener('click', () => contexto.abrirModalPlanta(null, { pantallaCompleta: true }));
  const contenedor = document.querySelector('#inicio-plantas');
  contenedor.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('button[data-action]');
    if (!boton) return;
    if (boton.dataset.action === 'detalle') {
      await contexto.abrirDetalle(boton.dataset.id);
      return;
    }
    if (boton.dataset.action !== 'regar') return;
    boton.disabled = true;
    try {
      await registrarCuidado(boton.dataset.id, 'riego', contexto.tApp('waterHistoryNote'));
      await contexto.cargarJardin();
    } catch (error) {
      contexto.mostrarMensaje(contexto.tApp('waterSaveError', { error: error.message }), true);
      boton.disabled = false;
    }
  });
}
