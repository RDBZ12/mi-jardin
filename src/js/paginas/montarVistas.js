import { vistaAutenticacion } from './autenticacionVista.js';
import { vistaInicio } from './inicio.js';
import { vistaPlantas } from './plantas.js';
import { vistaRiego } from './riego.js';
import { vistaRecordatorios } from './recordatorios.js';
import { vistaIdentificar } from './identificar.js';
import { vistaHistorial } from './historial.js';
import { vistaMenu } from './menu.js';
import { vistaModalPlanta } from '../componentes/modalPlanta.js';

const contenedorAutenticacion = document.getElementById('vista-auth');
const contenedorVistas = document.getElementById('contenedor-vistas');

if (contenedorAutenticacion) {
  const temporal = document.createElement('template');
  temporal.innerHTML = vistaAutenticacion.trim();
  contenedorAutenticacion.replaceWith(temporal.content.firstElementChild);
}

if (contenedorVistas) {
  contenedorVistas.innerHTML = [
    vistaInicio,
    vistaPlantas,
    vistaRiego,
    vistaIdentificar,
    vistaHistorial,
    vistaRecordatorios,
    vistaMenu,
    vistaModalPlanta,
  ].join('');
}
