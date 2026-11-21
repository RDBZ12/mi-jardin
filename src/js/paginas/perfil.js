import { obtenerPerfil, guardarNombrePerfil, actualizarContrasena } from "../servicios/perfilService.js";
import { obtenerPlantas, guardarPlanta } from "../servicios/plantas.js";
import { importarRegistroCuidado, obtenerHistorialCuidados } from "../servicios/cuidados.js";
import { obtenerRecordatoriosPendientes, importarRecordatorio } from "../servicios/recordatorios.js?perfil-respaldo-v2";
// El módulo de recordatorios aporta importarRecordatorio para restaurar respaldos.
import { limpiarEntrada } from "../utils/dom.js";

export function inicializarPerfil(contexto) {
  const formPerfil = document.querySelector("#form-perfil");
  const perfilNombre = document.querySelector("#perfil-nombre");
  const perfilError = document.querySelector("#perfil-error");
  const perfilMessage = document.querySelector("#perfil-message");
  const perfilGuardar = document.querySelector("#perfil-guardar");
  const formCambiarContrasena = document.querySelector("#form-cambiar-contrasena");
  const perfilContrasenaNueva = document.querySelector("#perfil-contrasena-nueva");
  const perfilContrasenaConfirmar = document.querySelector("#perfil-contrasena-confirmar");
  const perfilContrasenaError = document.querySelector("#perfil-contrasena-error");
  const perfilContrasenaMessage = document.querySelector("#perfil-contrasena-message");
  const perfilContrasenaGuardar = document.querySelector("#perfil-contrasena-guardar");
  [perfilContrasenaNueva, perfilContrasenaConfirmar].forEach((input) => {
    const caja = document.createElement("span");
    caja.className = "password-box";
    input.parentElement.insertBefore(caja, input);
    caja.append(input);

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "password-toggle";
    boton.setAttribute("aria-label", "Mostrar contraseña");
    boton.title = "Mostrar contraseña";
    boton.setAttribute("aria-controls", input.id);
    boton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    boton.addEventListener("click", () => {
      const mostrar = input.type === "password";
      input.type = mostrar ? "text" : "password";
      boton.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
      boton.title = boton.getAttribute("aria-label");
    });
    caja.append(boton);
  });
  const perfilRespaldoError = document.querySelector("#perfil-respaldo-error");
  const perfilRespaldoMensaje = document.querySelector("#perfil-respaldo-mensaje");
document.querySelector('#perfil-exportar').addEventListener('click', async () => {
  perfilRespaldoError.textContent = '';
  perfilRespaldoMensaje.textContent = '';
  try {
    const [plantas, cuidados, recordatorios] = await Promise.all([
      obtenerPlantas(), obtenerHistorialCuidados(), obtenerRecordatoriosPendientes(),
    ]);
    const respaldo = {
      app: 'mi-jardin', version: 1, exportedAt: new Date().toISOString(),
      plantas: plantas.map(({ foto_local_blob, foto_local_url, foto_url, foto_ruta, usuario_id, _offline, ...planta }) => planta),
      cuidados: cuidados.map(({ usuario_id, _offline, ...cuidado }) => cuidado),
      recordatorios: recordatorios.map(({ plantas: _plantas, usuario_id, _offline, ...recordatorio }) => recordatorio),
    };
    const archivo = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `mi-jardin-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(enlace);
    enlace.click();
    window.setTimeout(() => { URL.revokeObjectURL(url); enlace.remove(); }, 1000);
    perfilRespaldoMensaje.textContent = contexto.tApp('backupExported');
  } catch (error) {
    perfilRespaldoError.textContent = contexto.tApp('backupFailed', { error: error.message });
  }
});

document.querySelector('#perfil-importar').addEventListener('change', async (evento) => {
  const archivo = evento.target.files[0];
  if (!archivo) return;
  perfilRespaldoError.textContent = '';
  perfilRespaldoMensaje.textContent = '';
  let plantasImportadas = 0;
  let cuidadosImportados = 0;
  let recordatoriosImportados = 0;
  try {
    if (archivo.size > 10 * 1024 * 1024) throw new Error(contexto.tApp('invalidBackup'));
    const respaldo = JSON.parse(await archivo.text());
    const coleccionesValidas = ['plantas', 'cuidados', 'recordatorios'].every((clave) => Array.isArray(respaldo?.[clave]));
    if (respaldo?.app !== 'mi-jardin' || respaldo.version !== 1 || !coleccionesValidas
      || respaldo.plantas.length > 5000 || respaldo.cuidados.length > 20000 || respaldo.recordatorios.length > 5000) {
      throw new Error(contexto.tApp('invalidBackup'));
    }

    const idsPlanta = new Set();
    for (const planta of respaldo.plantas) {
      if (!planta?.id || !planta.nombre) throw new Error(contexto.tApp('invalidBackup'));
      const { foto_local_blob, foto_local_url, foto_url, foto_ruta, usuario_id, _offline, ...datos } = planta;
      await guardarPlanta({ ...datos, foto_ruta: null });
      idsPlanta.add(planta.id);
      plantasImportadas += 1;
    }
    const plantasExistentes = await obtenerPlantas();
    for (const cuidado of respaldo.cuidados) {
      if (!idsPlanta.has(cuidado?.planta_id) && !plantasExistentes.some((planta) => planta.id === cuidado?.planta_id)) continue;
      await importarRegistroCuidado(cuidado);
      cuidadosImportados += 1;
    }
    for (const recordatorio of respaldo.recordatorios) {
      if (!idsPlanta.has(recordatorio?.planta_id) && !plantasExistentes.some((planta) => planta.id === recordatorio?.planta_id)) continue;
      await importarRecordatorio(recordatorio);
      recordatoriosImportados += 1;
    }
    await contexto.cargarJardin();
    perfilRespaldoMensaje.textContent = contexto.tApp('backupImported', {
      plants: plantasImportadas, care: cuidadosImportados, reminders: recordatoriosImportados,
    });
  } catch (error) {
    perfilRespaldoError.textContent = contexto.tApp('backupFailed', { error: error.message });
  } finally {
    evento.target.value = '';
  }
});

formPerfil.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  perfilError.textContent = '';
  perfilMessage.textContent = '';
  const nombre = limpiarEntrada(perfilNombre);
  if (!nombre) {
    perfilError.textContent = contexto.tApp('enterProfileName');
    return;
  }
  if (!navigator.onLine || !contexto.obtenerEstado().servicioDisponible || !contexto.supabase) {
    perfilError.textContent = contexto.tApp('connectToSaveProfile');
    return;
  }

  perfilGuardar.disabled = true;
  perfilGuardar.textContent = contexto.tApp('savingProfile');
  try {
    await guardarNombrePerfil(contexto.supabase, nombre);
    perfilMessage.textContent = contexto.tApp('profileUpdated');
  } catch (error) {
    perfilError.textContent = contexto.tApp('saveProfileError', { error: error.message });
  } finally {
    perfilGuardar.disabled = false;
    perfilGuardar.textContent = contexto.tApp('saveChanges');
  }
});

formCambiarContrasena.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  perfilContrasenaError.textContent = '';
  perfilContrasenaMessage.textContent = '';
  const nueva = perfilContrasenaNueva.value;
  const confirmar = perfilContrasenaConfirmar.value;

  if (nueva !== confirmar) {
    perfilContrasenaError.textContent = contexto.tApp('passwordMismatch');
    return;
  }
  if (!navigator.onLine || !contexto.obtenerEstado().servicioDisponible || !contexto.supabase) {
    perfilContrasenaError.textContent = contexto.tApp('passwordOffline');
    return;
  }

  perfilContrasenaGuardar.disabled = true;
  perfilContrasenaGuardar.textContent = contexto.tApp('savingProfile');
  try {
    await actualizarContrasena(contexto.supabase, nueva);
    formCambiarContrasena.reset();
    perfilContrasenaMessage.textContent = contexto.tApp('passwordUpdated');
  } catch (error) {
    perfilContrasenaError.textContent = contexto.tApp('passwordUpdateError', { error: error.message });
  } finally {
    perfilContrasenaGuardar.disabled = false;
    perfilContrasenaGuardar.textContent = contexto.tApp('updatePassword');
  }
});



}

export async function cargarPerfil(contexto) {
  const perfilError = document.querySelector("#perfil-error");
  const perfilMessage = document.querySelector("#perfil-message");
  const perfilNombre = document.querySelector("#perfil-nombre");
  const perfilCorreo = document.querySelector("#perfil-correo");
  perfilError.textContent = '';
  perfilMessage.textContent = '';
  perfilNombre.disabled = true;
  perfilCorreo.value = '';
  perfilNombre.value = '';

  if (!navigator.onLine || !contexto.obtenerEstado().servicioDisponible || !contexto.supabase) {
    const usuarioOffline = contexto.obtenerSesionOffline();
    if (!usuarioOffline) {
      perfilError.textContent = contexto.tApp('noProfileOffline');
      return;
    }
    perfilNombre.value = usuarioOffline.user_metadata?.nombre_completo
      || usuarioOffline.user_metadata?.username
      || usuarioOffline.user_metadata?.full_name
      || '';
    perfilCorreo.value = usuarioOffline.email || '';
    perfilMessage.textContent = contexto.tApp('offlineReadOnly');
    contexto.actualizarResumenPerfil();
    return;
  }

  perfilMessage.textContent = contexto.tApp('loadingProfile');
  try {
    const { usuario, perfil } = await obtenerPerfil(contexto.supabase);
    perfilNombre.value = perfil.nombre_completo || '';
    perfilCorreo.value = perfil.correo || usuario.email || '';
    perfilNombre.disabled = false;
    perfilMessage.textContent = '';
    contexto.actualizarResumenPerfil();
  } catch (error) {
    perfilError.textContent = contexto.tApp('profileLoadError', { error: error.message });
    perfilMessage.textContent = '';
  }
}

