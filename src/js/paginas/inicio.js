export const vistaInicio = `<section class="app-page" id="pagina-inicio" data-pagina="inicio">
          <div class="plants-heading">
            <div><p class="section-eyebrow" id="inicio-fecha"></p><h1 id="inicio-saludo">Resumen</h1></div>
          </div>
          <p class="dashboard-message" id="dashboard-message" role="status" aria-live="polite"></p>

          <section class="kpis" aria-label="Resumen del jardín">
            <article class="kpi"><span class="kpi-etiqueta" data-t="plants">Plantas</span><strong class="kpi-valor" id="kpi-plantas">0</strong><span class="kpi-nota" id="kpi-plantas-nota" data-t="kpiPlantsNote">en tu jardín</span></article>
            <article class="kpi" id="kpi-riego-tarjeta"><span class="kpi-etiqueta" data-t="kpiWater">Por regar</span><strong class="kpi-valor" id="kpi-riego">0</strong><span class="kpi-nota" id="kpi-riego-nota"></span></article>
            <article class="kpi" id="kpi-atencion-tarjeta"><span class="kpi-etiqueta" data-t="kpiAttention">Atención</span><strong class="kpi-valor" id="kpi-atencion">0</strong><span class="kpi-nota" id="kpi-atencion-nota"></span></article>
            <article class="kpi"><span class="kpi-etiqueta" data-t="kpiHealth">Salud</span><strong class="kpi-valor" id="kpi-salud">—</strong><span class="kpi-nota" id="kpi-salud-nota"></span></article>
          </section>

          <section class="quick" aria-labelledby="quick-titulo">
            <h2 class="quick-titulo" id="quick-titulo" data-t="quickTitle">¿Qué necesitas hoy?</h2>
            <div class="quick-grid">
              <button class="quick-item" type="button" data-ir-a="riego"><span class="quick-texto" data-t="quickWater">Regar</span><span class="quick-cuenta" id="quick-riego"></span></button>
              <button class="quick-item" type="button" data-ir-a="plantas"><span class="quick-texto" data-t="quickCheck">Revisar salud</span><span class="quick-cuenta" id="quick-revisar"></span></button>
              <button class="quick-item" type="button" data-ir-a="recordatorios"><span class="quick-texto" data-t="reminders">Recordatorios</span></button>
              <button class="quick-item" type="button" id="inicio-accion-nueva"><span class="quick-texto" data-t="newPlant">Nueva planta</span></button>
            </div>
          </section>

          <div class="dash-grid">
            <div class="dash-col">
              <section class="dash-panel attention-block" aria-labelledby="attention-title">
                <div class="panel-cabecera"><h2 id="attention-title">Necesitan atención</h2><span id="attention-count"></span></div>
                <div class="attention-list" id="attention-list"></div>
              </section>
              <section class="dash-panel" aria-labelledby="proximos-titulo">
                <div class="panel-cabecera"><h2 id="proximos-titulo" data-t="upcomingWaterings">Próximos riegos</h2><button class="text-action" type="button" data-ir-a="riego" data-t="registerWater">Registrar riego</button></div>
                <div class="upcoming-list" id="upcoming-list"></div>
                <p class="health-summary" id="dashboard-health-summary"></p>
              </section>
            </div>
            <div class="dash-col">
              <section class="dash-panel" aria-labelledby="salud-titulo">
                <div class="panel-cabecera"><h2 id="salud-titulo" data-t="healthPanel">Salud del jardín</h2></div>
                <div class="salud-barra" id="salud-barra" role="img"></div>
                <ul class="leyenda" id="salud-leyenda"></ul>
              </section>
              <section class="dash-panel" aria-labelledby="actividad-titulo">
                <div class="panel-cabecera"><h2 id="actividad-titulo" data-t="activityPanel">Últimos 7 días</h2></div>
                <div class="actividad" id="actividad-grafica" role="img"></div>
                <ul class="leyenda leyenda-horizontal"><li><span class="punto punto-agua"></span><span data-t="activityWater">Riegos</span></li><li><span class="punto punto-revision"></span><span data-t="activityChecks">Revisiones</span></li></ul>
                <p class="week-summary" id="week-summary"></p>
              </section>
            </div>
          </div>

          <button class="fab-add-plant" id="inicio-nueva-planta" type="button" aria-label="Agregar planta" title="Agregar planta" data-tooltip="Agregar planta">
            <span aria-hidden="true">+</span>
          </button>
          <div class="section-heading home-plants-heading"><h2 data-t="collection">Tu colección</h2><button class="text-action" type="button" data-ir-a="plantas" data-t="seeAll">Ver todas</button></div>
          <div class="grid-plantas grid-inicio" id="inicio-plantas"></div>
        </section>`;

import { registrarCuidado, obtenerHistorialCuidados } from '../servicios/cuidados.js';
import { fechaProximoRiego } from '../utils/fechas.js';
import { crearTarjetaPlanta } from '../componentes/tarjetaPlanta.js';
import { crearInsigniaSalud } from '../componentes/seguimientoSalud.js';
import { plantasConAtencion, metricasJardin, actividadSemanal } from '../utils/salud.js';

function texto(id, valor) {
  const el = document.querySelector(id);
  if (el) el.textContent = valor;
}

export function renderizarInicio(contexto) {
  const { plantas } = contexto.obtenerEstado();
  const { tApp, crearElemento, tarjetasPara } = contexto;
  const idioma = contexto.obtenerIdioma();
  const usuario = contexto.obtenerSesionOffline?.();
  const nombre = usuario?.user_metadata?.nombre_completo || usuario?.user_metadata?.full_name || usuario?.user_metadata?.username || usuario?.email?.split('@')[0] || '';
  const iniciales = (nombre || 'Mi Jardín').trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'MJ';
  const avatar = document.querySelector('#inicio-avatar-usuario');
  if (avatar) { avatar.textContent = iniciales; avatar.setAttribute('aria-label', `Abrir perfil de ${nombre || 'Mi Jardín'}`); }

  const ahora = new Date();
  const primerNombre = nombre.trim().split(/\s+/)[0];
  texto('#inicio-saludo', primerNombre ? tApp('greeting', { name: primerNombre }) : tApp('homeTitle'));
  texto('#inicio-fecha', new Intl.DateTimeFormat(idioma, { weekday: 'long', day: 'numeric', month: 'long' }).format(ahora));

  const m = metricasJardin(plantas, ahora);
  const fechaCorta = (fecha) => fecha.toLocaleDateString(idioma, { day: 'numeric', month: 'short' });

  // Tarjetas de cifras
  texto('#kpi-plantas', String(m.total));
  texto('#kpi-riego', String(m.porRegar));
  texto('#kpi-riego-nota', m.proximoRiego ? tApp('kpiNextDate', { date: fechaCorta(m.proximoRiego) }) : '—');
  texto('#kpi-atencion', String(m.atencion));
  texto('#kpi-atencion-nota', m.urgentes ? (m.urgentes === 1 ? tApp('kpiUrgentOne') : tApp('kpiUrgent', { count: m.urgentes })) : tApp('kpiAllOk'));
  texto('#kpi-salud', m.porcentajeSano === null ? '—' : `${m.porcentajeSano} %`);
  texto('#kpi-salud-nota', m.revisadas ? tApp('kpiHealthNote', { good: m.distribucion.bien, reviewed: m.revisadas }) : tApp('kpiHealthNone'));
  document.querySelector('#kpi-riego-tarjeta')?.classList.toggle('kpi-alerta', m.porRegar > 0);
  document.querySelector('#kpi-atencion-tarjeta')?.classList.toggle('kpi-alerta', m.urgentes > 0);

  // Accesos rápidos con contador
  texto('#quick-riego', m.porRegar ? String(m.porRegar) : '');
  texto('#quick-revisar', m.sinRevisar ? String(m.sinRevisar) : '');

  // Próximos riegos con estado
  const listaProximos = document.querySelector('#upcoming-list');
  listaProximos.replaceChildren();
  const proximos = plantas
    .map((planta) => ({ planta, fecha: fechaProximoRiego(planta) }))
    .sort((a, b) => a.fecha - b.fecha);
  for (const item of proximos.slice(0, 5)) {
    const estado = contexto.calcularEstadoRiego(item.planta);
    const fila = crearElemento('div', 'upcoming-row');
    fila.append(
      crearElemento('strong', '', item.planta.nombre),
      crearElemento('span', 'upcoming-fecha', fechaCorta(item.fecha)),
      crearElemento('span', `plant-badge ${estado.clase}`, estado.texto),
    );
    listaProximos.append(fila);
  }
  if (!proximos.length) listaProximos.append(crearElemento('p', 'page-intro', tApp('addPlantForWater')));
  texto('#dashboard-health-summary', plantas.length
    ? `${m.porRegar} ${tApp('dueToday')} · ${plantas.length - m.porRegar} ${tApp('upToDate')}.`
    : '');

  renderizarSalud(contexto, m);
  renderizarAtencion(contexto, plantas);
  renderizarActividad(contexto, []);
  void obtenerHistorialCuidados().then((registros) => {
    if (contexto.obtenerEstado().vistaActual === 'inicio') renderizarActividad(contexto, registros);
  }).catch(() => {});

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

// Barra apilada con el reparto de estados de salud.
function renderizarSalud(contexto, m) {
  const { tApp, crearElemento } = contexto;
  const barra = document.querySelector('#salud-barra');
  const leyenda = document.querySelector('#salud-leyenda');
  barra.replaceChildren();
  leyenda.replaceChildren();
  const filas = [
    ['bien', tApp('healthGood')], ['regular', tApp('healthFair')], ['mal', tApp('healthBad')], ['sin', tApp('notReviewed')],
  ];
  barra.setAttribute('aria-label', filas.map(([clave, nombre]) => `${nombre}: ${m.distribucion[clave]}`).join(', '));
  barra.classList.toggle('salud-barra-vacia', !m.total);
  for (const [clave, nombre] of filas) {
    const cantidad = m.distribucion[clave];
    if (cantidad) {
      const tramo = crearElemento('span', `tramo tramo-${clave}`);
      tramo.style.flexGrow = String(cantidad);
      barra.append(tramo);
    }
    const item = crearElemento('li', '');
    item.append(crearElemento('span', `punto punto-${clave}`), crearElemento('span', 'leyenda-nombre', nombre), crearElemento('strong', '', String(cantidad)));
    leyenda.append(item);
  }
}

// Gráfica de barras de los últimos 7 días (riegos + revisiones), con dos segmentos por día.
function renderizarActividad(contexto, registros) {
  const { tApp, crearElemento } = contexto;
  const grafica = document.querySelector('#actividad-grafica');
  if (!grafica) return;
  const dias = actividadSemanal(registros);
  const maximo = Math.max(1, ...dias.map((d) => d.riegos + d.revisiones));
  const idioma = contexto.obtenerIdioma();
  const totalRiegos = dias.reduce((n, d) => n + d.riegos, 0);
  const totalRevisiones = dias.reduce((n, d) => n + d.revisiones, 0);
  grafica.replaceChildren();
  grafica.setAttribute('aria-label', tApp('activityLabel', { water: totalRiegos, reviews: totalRevisiones }));
  for (const dia of dias) {
    const columna = crearElemento('div', 'actividad-dia');
    const pila = crearElemento('div', 'actividad-pila');
    const total = dia.riegos + dia.revisiones;
    pila.title = `${dia.fecha.toLocaleDateString(idioma, { weekday: 'long', day: 'numeric', month: 'short' })}: ${tApp('activityLabel', { water: dia.riegos, reviews: dia.revisiones })}`;
    if (dia.revisiones) {
      const seg = crearElemento('span', 'seg seg-revision');
      seg.style.height = `${(dia.revisiones / maximo) * 100}%`;
      pila.append(seg);
    }
    if (dia.riegos) {
      const seg = crearElemento('span', 'seg seg-agua');
      seg.style.height = `${(dia.riegos / maximo) * 100}%`;
      pila.append(seg);
    }
    if (!total) pila.classList.add('actividad-vacia');
    columna.append(pila, crearElemento('span', 'actividad-etiqueta', dia.fecha.toLocaleDateString(idioma, { weekday: 'narrow' })));
    grafica.append(columna);
  }
  texto('#week-summary', totalRiegos + totalRevisiones === 0 ? tApp('activityEmpty') : '');
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
      localStorage.setItem('mi-jardin-perfil-atajo-origen', 'inicio');
      contexto.navegarA('menu', 'menu');
      document.querySelector('[data-subvista="sub-perfil"]')?.click();
    });
  }
  for (const id of ['#inicio-nueva-planta', '#inicio-accion-nueva']) {
    document.querySelector(id)?.addEventListener('click', () => contexto.abrirModalPlanta(null, { pantallaCompleta: true }));
  }
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

function renderizarAtencion(contexto, plantas) {
  const { tApp, crearElemento } = contexto;
  const lista = document.querySelector('#attention-list');
  const contador = document.querySelector('#attention-count');
  if (!lista) return;
  texto('#attention-title', tApp('needsAttention'));
  lista.replaceChildren();

  if (!plantas.length) {
    contador.textContent = '';
    lista.append(crearElemento('p', 'attention-ok', tApp('emptyGarden')));
    return;
  }

  const pendientes = plantasConAtencion(plantas);
  contador.textContent = pendientes.length === 1 ? tApp('attentionOne') : (pendientes.length ? tApp('attentionCount', { count: pendientes.length }) : '');
  if (!pendientes.length) lista.append(crearElemento('p', 'attention-ok', tApp('allGood')));
  for (const { planta, nivel, motivos } of pendientes.slice(0, 5)) {
    const fila = crearElemento('article', `attention-row attention-${nivel}`);
    const detalle = crearElemento('div', 'attention-text');
    detalle.append(
      crearElemento('strong', '', planta.nombre),
      crearElemento('small', '', motivos.map((motivo) => tApp(motivo.clave, motivo.valores)).join(' · ')),
    );
    const accion = crearElemento('button', 'plant-action', tApp('reviewNow'));
    accion.type = 'button';
    accion.addEventListener('click', () => contexto.abrirDetalle(planta.id));
    fila.append(planta.estado_salud ? crearInsigniaSalud(planta.estado_salud) : crearElemento('span', 'attention-dot'), detalle, accion);
    lista.append(fila);
  }
}
