import { sanitizarTexto } from '../utils/dom.js';
import { crearInsigniaSalud } from './seguimientoSalud.js';

export function crearTarjetaPlanta(planta, urlFoto, incluirEliminar = true, { tApp, traduccionCategoria, calcularEstadoRiego }) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'plant-card';
  tarjeta.dataset.plantaId = planta.id;

  if (urlFoto) {
    const imagen = document.createElement('img');
    imagen.className = 'plant-photo';
    imagen.src = urlFoto;
    imagen.alt = `Foto de ${planta.nombre}`;
    imagen.loading = 'lazy';
    tarjeta.append(imagen);
  } else {
    const sinFoto = document.createElement('div');
    sinFoto.className = 'plant-photo-placeholder';
    sinFoto.textContent = tApp('noPhoto');
    tarjeta.append(sinFoto);
  }

  const info = document.createElement('div');
  info.className = 'plant-info';
  const nombre = document.createElement('h2');
  nombre.append(sanitizarTexto(planta.nombre));
  info.append(nombre);

  const especie = document.createElement('p');
  especie.className = 'plant-species';
  especie.textContent = planta.nombre_cientifico || traduccionCategoria(planta.categoria) || tApp('plantFallback');
  info.append(especie);

  const estado = calcularEstadoRiego(planta);
  const badge = document.createElement('span');
  badge.className = `plant-badge ${estado.clase}`;
  badge.textContent = estado.texto;
  info.append(badge);
  if (planta.estado_salud) {
    const salud = crearInsigniaSalud(planta.estado_salud);
    salud.classList.add('plant-health');
    info.append(salud);
  }
  tarjeta.append(info);

  const acciones = document.createElement('div');
  acciones.className = 'plant-actions';
  const regar = document.createElement('button');
  regar.className = 'plant-action plant-action-water';
  regar.type = 'button';
  regar.dataset.action = 'regar';
  regar.dataset.id = planta.id;
  regar.textContent = tApp('waterNow');
  acciones.append(regar);

  const detalle = document.createElement('button');
  detalle.className = 'plant-action';
  detalle.type = 'button';
  detalle.dataset.action = 'detalle';
  detalle.dataset.id = planta.id;
  detalle.textContent = tApp('details');
  acciones.append(detalle);

  if (incluirEliminar) {
    const eliminar = document.createElement('button');
    eliminar.className = 'plant-action';
    eliminar.type = 'button';
    eliminar.dataset.action = 'eliminar';
    eliminar.dataset.id = planta.id;
    eliminar.textContent = tApp('delete');
    acciones.append(eliminar);
  }

  tarjeta.append(acciones);
  return tarjeta;
}
