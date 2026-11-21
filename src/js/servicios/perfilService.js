import { guardarSesionOffline } from "./sincronizador.js";

export async function obtenerPerfil(cliente) {
  const { data: sessionData, error: sessionError } = await cliente.auth.getUser();
  if (sessionError) throw sessionError;
  if (!sessionData.user) throw new Error("No hay una sesión activa.");
  const { data, error } = await cliente
    .from("perfiles")
    .select("nombre_completo, correo")
    .eq("id", sessionData.user.id)
    .single();
  if (error) throw error;
  return { usuario: sessionData.user, perfil: data };
}

export async function guardarNombrePerfil(cliente, nombre) {
  const { data: sessionData, error: sessionError } = await cliente.auth.getUser();
  if (sessionError) throw sessionError;
  if (!sessionData.user) throw new Error("No hay una sesión activa.");
  const { error } = await cliente
    .from("perfiles")
    .update({ nombre_completo: nombre })
    .eq("id", sessionData.user.id);
  if (error) throw error;
  const usuario = {
    ...sessionData.user,
    user_metadata: { ...sessionData.user.user_metadata, nombre_completo: nombre },
  };
  guardarSesionOffline(usuario);
  return usuario;
}

export async function actualizarContrasena(cliente, nueva) {
  const { error } = await cliente.auth.updateUser({ password: nueva });
  if (error) throw error;
}
