import { crearReportesService, Http } from '../../src/reportes/reportesService';
import { DatosReporte } from '../../src/reportes/tipos';

const datos: DatosReporte = {
  titulo: '  Ascensor detenido  ',
  descripcion: 'Se quedó entre pisos',
  torre_unidad: 'B-3',
  categoria_id: 2,
  estado: 'en_progreso',
};

const reporteDeApi = {
  id: 7,
  titulo: 'Ascensor detenido',
  descripcion: 'Se quedó entre pisos',
  estado: 'pendiente',
  torre_unidad: 'B-3',
  categoria_id: 2,
  usuario_id: 1,
};

function servicioCon(respuesta: { status: number; data: unknown } | Error) {
  const request = jest.fn(() =>
    respuesta instanceof Error ? Promise.reject(respuesta) : Promise.resolve(respuesta),
  );
  const http: Http = { request };
  return { service: crearReportesService(http), request };
}

describe('crear', () => {
  test('hace POST /reportes sin estado y con los textos recortados', async () => {
    const { service, request } = servicioCon({ status: 201, data: reporteDeApi });

    const resultado = await service.crear(datos);

    expect(request).toHaveBeenCalledWith('POST', '/reportes', {
      titulo: 'Ascensor detenido',
      descripcion: 'Se quedó entre pisos',
      torre_unidad: 'B-3',
      categoria_id: 2,
    });
    expect(resultado).toEqual({ ok: true, data: reporteDeApi });
  });

  test('un 422 deja un mensaje por campo y nunca JSON crudo', async () => {
    const { service } = servicioCon({
      status: 422,
      data: { errors: ["Titulo can't be blank", 'Categoria must exist'] },
    });

    const resultado = await service.crear(datos);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error.status).toBe(422);
      expect(resultado.error.campos.titulo).toBe('El título no puede estar vacío');
      expect(resultado.error.campos.categoria_id).toBeDefined();
      expect(resultado.error.mensaje).toBe('Revisa los campos marcados.');
    }
  });
});

describe('actualizar', () => {
  test('hace PATCH /reportes/:id incluyendo el estado', async () => {
    const { service, request } = servicioCon({ status: 200, data: reporteDeApi });

    await service.actualizar(7, datos);

    expect(request).toHaveBeenCalledWith('PATCH', '/reportes/7', {
      titulo: 'Ascensor detenido',
      descripcion: 'Se quedó entre pisos',
      torre_unidad: 'B-3',
      categoria_id: 2,
      estado: 'en_progreso',
    });
  });

  test('un 403 muestra el mensaje que manda la API', async () => {
    const { service } = servicioCon({
      status: 403,
      data: { error: 'No tienes permiso para modificar este recurso' },
    });

    const resultado = await service.actualizar(7, datos);

    expect(resultado).toEqual({
      ok: false,
      error: {
        status: 403,
        campos: {},
        mensaje: 'No tienes permiso para modificar este recurso',
      },
    });
  });

  test('un 403 sin mensaje usa uno por defecto', async () => {
    const { service } = servicioCon({ status: 403, data: null });

    const resultado = await service.actualizar(7, datos);

    expect(!resultado.ok && resultado.error.mensaje).toBe('No tienes permiso para esta acción.');
  });

  test('un 404 avisa que el reporte ya no existe', async () => {
    const { service } = servicioCon({ status: 404, data: { error: 'No se encontró' } });

    const resultado = await service.actualizar(7, datos);

    expect(!resultado.ok && resultado.error.mensaje).toBe('El reporte ya no existe.');
  });

  test('un 401 pide volver a iniciar sesión y conserva el status para quien lo necesite', async () => {
    const { service } = servicioCon({ status: 401, data: { error: 'No autorizado' } });

    const resultado = await service.actualizar(7, datos);

    expect(!resultado.ok && resultado.error.status).toBe(401);
    expect(!resultado.ok && resultado.error.mensaje).toBe(
      'Tu sesión expiró. Vuelve a iniciar sesión.',
    );
  });

  test('un 500 no expone el cuerpo de la respuesta', async () => {
    const { service } = servicioCon({ status: 500, data: '<html>Traza interna</html>' });

    const resultado = await service.actualizar(7, datos);

    expect(!resultado.ok && resultado.error.mensaje).toBe(
      'Ocurrió un error en el servidor. Intenta de nuevo.',
    );
  });

  test('sin conexión devuelve status 0 y un mensaje claro', async () => {
    const { service } = servicioCon(new Error('Network request failed'));

    const resultado = await service.actualizar(7, datos);

    expect(resultado).toEqual({
      ok: false,
      error: {
        status: 0,
        campos: {},
        mensaje: 'No hay conexión. Revisa tu internet e intenta de nuevo.',
      },
    });
  });
});

describe('listarCategorias', () => {
  test('hace GET /categorias y devuelve la lista', async () => {
    const categorias = [{ id: 2, nombre: 'Ascensores' }];
    const { service, request } = servicioCon({ status: 200, data: categorias });

    const resultado = await service.listarCategorias();

    expect(request).toHaveBeenCalledWith('GET', '/categorias', undefined);
    expect(resultado).toEqual({ ok: true, data: categorias });
  });
});
