// Mensaje que se muestra cuando una llamada a la API falla.
//
// - 403: la API explica el motivo en el campo "error" (por ejemplo "Esta acción es
//   solo para administradores"); si no viene, se usa un mensaje genérico.
// - 409 / 422: la API manda una lista en "errors"; se une en una sola línea.
// - Cualquier otro caso: el mensaje por defecto que recibe cada pantalla.
export function mensajeDeApi(err, porDefecto) {
  const data = err.response?.data;

  if (err.response?.status === 403) {
    return data?.error || "No tienes permiso para esta acción.";
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(", ");
  }

  return porDefecto;
}
