export function crearElemento(etiqueta, clases = '', texto) {
  const elemento = document.createElement(etiqueta);
  if (clases) elemento.className = clases;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

export function mostrarVacio(contenedor, texto) {
  const estado = crearElemento('div', 'empty-state');
  estado.append(crearElemento('h2', '', texto));
  contenedor.replaceChildren(estado);
}

export function limpiarEntrada(campo) {
  return String(campo?.value ?? '').trim();
}

export function sanitizarTexto(valor) {
  return document.createTextNode(String(valor ?? ''));
}

export function limpiarCamposSensibles(...campos) {
  for (const campo of campos.flat()) {
    if (campo) campo.value = '';
  }
}
