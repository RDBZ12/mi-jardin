export function fechaLocal(valor) {
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }
  return new Date(valor);
}

export function fechaProximoRiego(planta) {
  const base = planta.ultimo_riego || planta.fecha_adquisicion || planta.creado_en;
  if (!base) return new Date();

  const frecuencia = Math.max(1, Number(planta.frecuencia_riego_dias) || 7);
  const proximo = fechaLocal(base);
  if (Number.isNaN(proximo.getTime())) return new Date();
  proximo.setDate(proximo.getDate() + frecuencia);
  proximo.setHours(0, 0, 0, 0);
  return proximo;
}

export function formatearFecha(valor, idioma = 'es', incluirHora = false, textoFechaFaltante = 'Sin definir') {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return textoFechaFaltante;
  return new Intl.DateTimeFormat(idioma, incluirHora
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(fecha);
}
