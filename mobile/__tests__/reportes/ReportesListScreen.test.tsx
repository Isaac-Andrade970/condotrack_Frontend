/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ReportesListScreen from '../../src/reportes/ReportesListScreen';
import { ReportesService } from '../../src/reportes/reportesService';
import { Reporte } from '../../src/reportes/tipos';
import {
  crearService,
  existe,
  falla,
  porId,
  Renderer,
  reporteBase,
  textoDe,
  tocar,
} from '../../test-utils/ayudas';

const ajeno: Reporte = { ...reporteBase, id: 8, titulo: 'Fuga de agua', usuario_id: 2 };
const usuario = { id: 1, rol: 'residente' };

async function montar(service: ReportesService, activa = true) {
  const onAbrir = jest.fn();
  const onNuevo = jest.fn();
  let renderer!: Renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ReportesListScreen
        service={service}
        usuario={usuario}
        onAbrir={onAbrir}
        onNuevo={onNuevo}
        activa={activa}
      />,
    );
  });
  return { renderer, onAbrir, onNuevo };
}

describe('ReportesListScreen', () => {
  test('muestra los reportes y marca solo los del usuario', async () => {
    const service = crearService({
      listar: jest.fn(async () => ({ ok: true as const, data: [reporteBase, ajeno] })),
    });
    const { renderer } = await montar(service);

    expect(textoDe(porId(renderer, 'reporte-7'))).toContain('Ascensor detenido');
    expect(textoDe(porId(renderer, 'reporte-8'))).toContain('Fuga de agua');
    expect(existe(renderer, 'mio-7')).toBe(true);
    expect(existe(renderer, 'mio-8')).toBe(false);
    expect(existe(renderer, 'cargando-listado')).toBe(false);
  });

  test('al tocar un reporte llama a onAbrir con ese reporte', async () => {
    const { renderer, onAbrir } = await montar(crearService());

    await tocar(renderer, 'reporte-7');

    expect(onAbrir).toHaveBeenCalledWith(reporteBase);
  });

  test('«Nuevo reporte» llama a onNuevo', async () => {
    const { renderer, onNuevo } = await montar(crearService());

    await tocar(renderer, 'boton-nuevo');

    expect(onNuevo).toHaveBeenCalled();
  });

  test('sin reportes muestra el mensaje de listado vacío', async () => {
    const service = crearService({ listar: jest.fn(async () => ({ ok: true as const, data: [] })) });
    const { renderer } = await montar(service);

    expect(existe(renderer, 'sin-reportes')).toBe(true);
  });

  test('si falla muestra el error y permite reintentar', async () => {
    const listar = jest
      .fn()
      .mockResolvedValueOnce(falla(0, 'No hay conexión. Revisa tu internet e intenta de nuevo.'))
      .mockResolvedValueOnce({ ok: true, data: [reporteBase] });
    const { renderer } = await montar(crearService({ listar }));

    expect(textoDe(porId(renderer, 'error-listado'))).toBe(
      'No hay conexión. Revisa tu internet e intenta de nuevo.',
    );
    expect(existe(renderer, 'sin-reportes')).toBe(false);

    await tocar(renderer, 'reintentar-listado');

    expect(existe(renderer, 'error-listado')).toBe(false);
    expect(existe(renderer, 'reporte-7')).toBe(true);
  });

  test('si no está activa no consulta la API; al activarse sí', async () => {
    const service = crearService();
    const { renderer, onAbrir, onNuevo } = await montar(service, false);
    expect(service.listar).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      renderer.update(
        <ReportesListScreen
          service={service}
          usuario={usuario}
          onAbrir={onAbrir}
          onNuevo={onNuevo}
          activa
        />,
      );
    });

    expect(service.listar).toHaveBeenCalledTimes(1);
    expect(existe(renderer, 'reporte-7')).toBe(true);
  });
});
