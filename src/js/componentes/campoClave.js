const ICONO_OJO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';

function actualizarEtiqueta(boton, input, traducciones) {
  const mostrar = input.type === 'password';
  const texto = mostrar ? traducciones.mostrar : traducciones.ocultar;
  boton.setAttribute('aria-label', texto);
  boton.title = texto;
}

function prepararCampo(input, traducciones) {
  if (input.dataset.campoClaveInicializado === 'true') return;
  let caja = input.closest('.password-box');
  let boton = caja?.querySelector('.password-toggle');
  if (!caja) {
    caja = document.createElement('span');
    caja.className = 'password-box';
    input.parentElement.insertBefore(caja, input);
    caja.append(input);
  }
  if (!boton) {
    boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'password-toggle';
    boton.setAttribute('aria-controls', input.id);
    boton.innerHTML = ICONO_OJO;
    boton.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      actualizarEtiqueta(boton, input, traducciones);
    });
    caja.append(boton);
  }
  input.dataset.campoClaveInicializado = 'true';
  actualizarEtiqueta(boton, input, traducciones);
}

export function inicializarCamposClave(root = document, traducciones = { mostrar: 'Mostrar contraseña', ocultar: 'Ocultar contraseña' }) {
  root.querySelectorAll('input[type="password"]').forEach((input) => prepararCampo(input, traducciones));
}

export function actualizarEtiquetasCamposClave(traducciones) {
  document.querySelectorAll('input[data-campo-clave-inicializado="true"]').forEach((input) => {
    const boton = input.closest('.password-box')?.querySelector('.password-toggle');
    if (boton) actualizarEtiqueta(boton, input, traducciones);
  });
}
