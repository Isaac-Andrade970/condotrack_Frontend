import { crearReportesService, Http } from '../../src/reportes/reportesService';
import { reporteBase } from '../../test-utils/ayudas';

function httpCon(status: number, data: unknown = null) {
  const request = jest.fn(async () => ({ status, data }));
  const http: Http = { request };
  return { request, service: crearReportesService(http) };
}

describe('reportesService: consultas, estado y eliminación', () => {
  test('listar pide GET /reportes', async () => {
    const { request, service } = httpCon(200, [reporteBase]);

    const resultado = await service.listar();

    expect(request).toHaveBeenCalledWith('GET', '/reportes', undefined);
    expect(resultado).toEqual({ ok: true, data: [reporteBase] });
  });

  test('obtener pide GET /reportes/:id', async () => {
    const { request, service } = httpCon(200, reporteBase);

    await service.obtener(7);

    expect(request).toHaveBeenCalledWith('GET', '/reportes/7', undefined);
  });

  test('cambiarEstado envía únicamente { estado }', async () => {
    const { request, service } = httpCon(200, { ...reporteBase, estado: 'resuelto' });

    const resultado = await service.cambiarEstado(7, 'resuelto');

    expect(request).toHaveBeenCalledWith('PATCH', '/reportes/7', { estado: 'resuelto' });
    expect(resultado.ok).toBe(true);
  });

  test('eliminar responde ok con null ante un 204', async () => {
    const { request, service } = httpCon(204);

    const resultado = await service.eliminar(7);

    expect(request).toHaveBeenCalledWith('DELETE', '/reportes/7', undefined);
    expect(resultado).toEqual({ ok: true, data: null });
  });

  test('un 403 usa el mensaje de la API', async () => {
    const { service } = httpCon(403, { error: 'No tienes permiso para modificar este recurso' });

    const resultado = await service.eliminar(7);

    expect(resultado).toEqual({
      ok: false,
      error: { status: 403, campos: {}, mensaje: 'No tienes permiso para modificar este recurso' },
    });
  });

  test('un 403 sin mensaje usa uno genérico', async () => {
    const { service } = httpCon(403, {});

    const resultado = await service.cambiarEstado(7, 'resuelto');

    expect(!resultado.ok && resultado.error.mensaje).toBe('No tienes permiso para esta acción.');
  });

  test('un 404 dice que el reporte ya no existe', async () => {
    const { service } = httpCon(404, { error: 'Not found' });

    const resultado = await service.obtener(99);

    expect(!resultado.ok && resultado.error.mensaje).toBe('El reporte ya no existe.');
  });

  test('un 401 pide volver a iniciar sesión', async () => {
    const { service } = httpCon(401, {});

    const resultado = await service.listar();

    expect(!resultado.ok && resultado.error.mensaje).toBe('Tu sesión expiró. Vuelve a iniciar sesión.');
  });

  test('un 500 muestra un mensaje legible, no el cuerpo crudo', async () => {
    const { service } = httpCon(500, { trace: 'boom' });

    const resultado = await service.listar();

    expect(!resultado.ok && resultado.error.mensaje).toBe(
      'Ocurrió un error en el servidor. Intenta de nuevo.',
    );
  });

  test('sin conexión devuelve status 0', async () => {
    const http: Http = {
      request: jest.fn(async () => {
        throw new Error('Network Error');
      }),
    };

    const resultado = await crearReportesService(http).listar();

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
