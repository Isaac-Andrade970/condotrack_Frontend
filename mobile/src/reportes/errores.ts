import { CampoReporte, DatosReporte, ErroresCampos } from './tipos';

// Cómo se llama cada campo en pantalla y cómo lo nombra la API en sus errores 422.
// Rails responde con textos como "Titulo can't be blank" (nombre del atributo
// sin tilde + motivo en inglés), no con un objeto por campo.
const CAMPOS: { campo: CampoReporte; etiqueta: string; prefijoApi: string }[] = [
  { campo: 'titulo', etiqueta: 'El título', prefijoApi: 'titulo' },
  { campo: 'descripcion', etiqueta: 'La descripción', prefijoApi: 'descripcion' },
  { campo: 'torre_unidad', etiqueta: 'La torre o unidad', prefijoApi: 'torre unidad' },
  { campo: 'categoria_id', etiqueta: 'La categoría', prefijoApi: 'categoria' },
  { campo: 'estado', etiqueta: 'El estado', prefijoApi: 'estado' },
];

const MOTIVOS: { api: string; texto: string }[] = [
  { api: "can't be blank", texto: 'no puede estar vacío' },
  { api: 'must exist', texto: 'no es válida, elige una de la lista' },
  { api: 'is not included in the list', texto: 'no tiene un valor válido' },
];

function traducirMotivo(motivo: string): string {
  return MOTIVOS.find(m => m.api === motivo)?.texto ?? motivo;
}

export type ErroresDeApi = {
  campos: ErroresCampos;
  // Errores que no corresponden a un campo del formulario.
  generales: string[];
};

// Reparte los mensajes de un 422 entre los campos del formulario.
export function repartirErroresDeApi(mensajes: string[]): ErroresDeApi {
  const campos: ErroresCampos = {};
  const generales: string[] = [];

  for (const mensaje of mensajes) {
    const minuscula = mensaje.toLowerCase();
    const coincide = CAMPOS.find(c => minuscula.startsWith(c.prefijoApi + ' '));

    if (!coincide) {
      generales.push(mensaje);
      continue;
    }

    const motivo = mensaje.slice(coincide.prefijoApi.length + 1);
    // Si un campo tiene varios errores se muestra solo el primero.
    if (!campos[coincide.campo]) {
      campos[coincide.campo] = `${coincide.etiqueta} ${traducirMotivo(motivo)}`;
    }
  }

  return { campos, generales };
}

// Validación antes de llamar a la API: evita una petición que ya se sabe inválida.
// Es la misma regla que aplica el backend (título obligatorio y categoría existente).
export function validarDatos(datos: DatosReporte): ErroresCampos {
  const errores: ErroresCampos = {};

  if (datos.titulo.trim() === '') {
    errores.titulo = 'El título no puede estar vacío';
  }
  if (datos.categoria_id === null) {
    errores.categoria_id = 'Elige una categoría';
  }

  return errores;
}
