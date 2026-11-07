import { repartirErroresDeApi } from './errores';
import { Categoria, DatosReporte, ErroresCampos, Reporte } from './tipos';

// Contrato mínimo con el cliente HTTP de la app. Devuelve siempre la respuesta
// (sea 2xx o no) y solo rechaza la promesa cuando no hubo conexión. Así este
// servicio no depende de cómo la app guarda el token ni de dónde sale la URL.
export type HttpMetodo = 'GET' | 'POST' | 'PATCH';
export type HttpRespuesta = { status: number; data: unknown };
export interface Http {
  request(metodo: HttpMetodo, ruta: string, cuerpo?: unknown): Promise<HttpRespuesta>;
}

export type ErrorApi = {
  // 0 = no hubo conexión.
  status: number;
  // Texto listo para mostrar: nunca JSON crudo ni trazas.
  mensaje: string;
  campos: ErroresCampos;
};

export type Resultado<T> = { ok: true; data: T } | { ok: false; error: ErrorApi };

export type ReportesService = {
  listarCategorias(): Promise<Resultado<Categoria[]>>;
  crear(datos: DatosReporte): Promise<Resultado<Reporte>>;
  actualizar(id: number, datos: DatosReporte): Promise<Resultado<Reporte>>;
};

function textos(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.filter(v => typeof v === 'string') : [];
}

function errorDeRespuesta({ status, data }: HttpRespuesta): ErrorApi {
  const cuerpo = (data ?? {}) as { error?: unknown; errors?: unknown };

  if (status === 422) {
    const { campos, generales } = repartirErroresDeApi(textos(cuerpo.errors));
    return {
      status,
      campos,
      mensaje: generales[0] ?? 'Revisa los campos marcados.',
    };
  }
  if (status === 403) {
    const mensaje = typeof cuerpo.error === 'string' ? cuerpo.error : '';
    return { status, campos: {}, mensaje: mensaje || 'No tienes permiso para esta acción.' };
  }
  if (status === 404) {
    return { status, campos: {}, mensaje: 'El reporte ya no existe.' };
  }
  if (status === 401) {
    return { status, campos: {}, mensaje: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
  }
  return { status, campos: {}, mensaje: 'Ocurrió un error en el servidor. Intenta de nuevo.' };
}

async function pedir<T>(
  http: Http,
  metodo: HttpMetodo,
  ruta: string,
  cuerpo?: unknown,
): Promise<Resultado<T>> {
  let respuesta: HttpRespuesta;
  try {
    respuesta = await http.request(metodo, ruta, cuerpo);
  } catch {
    return {
      ok: false,
      error: {
        status: 0,
        campos: {},
        mensaje: 'No hay conexión. Revisa tu internet e intenta de nuevo.',
      },
    };
  }

  if (respuesta.status >= 200 && respuesta.status < 300) {
    return { ok: true, data: respuesta.data as T };
  }
  return { ok: false, error: errorDeRespuesta(respuesta) };
}

function cuerpoDe(datos: DatosReporte, incluirEstado: boolean) {
  const cuerpo = {
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    torre_unidad: datos.torre_unidad.trim(),
    categoria_id: datos.categoria_id,
  };
  return incluirEstado ? { ...cuerpo, estado: datos.estado } : cuerpo;
}

export function crearReportesService(http: Http): ReportesService {
  return {
    listarCategorias: () => pedir<Categoria[]>(http, 'GET', '/categorias'),
    // Al crear no se envía estado: la API lo deja en "pendiente".
    crear: datos => pedir<Reporte>(http, 'POST', '/reportes', cuerpoDe(datos, false)),
    actualizar: (id, datos) =>
      pedir<Reporte>(http, 'PATCH', `/reportes/${id}`, cuerpoDe(datos, true)),
  };
}
