/**
 * @format
 */

import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ReporteDetailScreen from '../../src/reportes/ReporteDetailScreen';
import { ReportesService } from '../../src/reportes/reportesService';
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

const autor = { id: 1, rol: 'residente' };
const residenteAjeno = { id: 2, rol: 'residente' };
const adminAjeno = { id: 3, rol: 'administrador' };

async function montar(service: ReportesService, usuario: { id: number; rol?: string }) {
  const onEditar = jest.fn();
  const onEliminado = jest.fn();
  const onVolver = jest.fn();
  let renderer!: Renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ReporteDetailScreen
        service={service}
        usuario={usuario}
        reporteId={7}
        onEditar={onEditar}
        onEliminado={onEliminado}
        onVolver={onVolver}
      />,
    );
  });
  return { renderer, onEditar, onEliminado, onVolver };
}

describe('ReporteDetailScreen', () => {
  let alerta: jest.SpyInstance;

  beforeEach(() => {
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alerta.mockRestore();
  });

  test('muestra los datos del reporte con el nombre de la categoría', async () => {
    const { renderer } = await montar(crearService(), autor);

    expect(textoDe(porId(renderer, 'detalle-titulo'))).toBe('Ascensor detenido');
    expect(textoDe(porId(renderer, 'detalle-categoria'))).toBe('Ascensores');
    expect(textoDe(porId(renderer, 'detalle-torre'))).toBe('Torre A');
    expect(textoDe(porId(renderer, 'detalle-descripcion'))).toBe('Se quedó en el piso 3');
  });

  test('sin torre ni descripción muestra textos de relleno', async () => {
    const service = crearService({
      obtener: jest.fn(async () => ({
        ok: true as const,
        data: { ...reporteBase, torre_unidad: null, descripcion: null },
      })),
    });
    const { renderer } = await montar(service, autor);

    expect(textoDe(porId(renderer, 'detalle-torre'))).toBe('Sin especificar');
    expect(textoDe(porId(renderer, 'detalle-descripcion'))).toBe('Sin descripción');
  });

  test('el autor ve Editar y Eliminar, y no el cambio de estado', async () => {
    const { renderer, onEditar } = await montar(crearService(), autor);

    expect(existe(renderer, 'boton-editar')).toBe(true);
    expect(existe(renderer, 'boton-eliminar')).toBe(true);
    expect(existe(renderer, 'cambiar-estado-resuelto')).toBe(false);
    expect(existe(renderer, 'solo-lectura')).toBe(false);

    await tocar(renderer, 'boton-editar');
    expect(onEditar).toHaveBeenCalledWith(reporteBase);
  });

  test('un administrador ajeno solo ve el cambio de estado', async () => {
    const { renderer } = await montar(crearService(), adminAjeno);

    expect(existe(renderer, 'cambiar-estado-pendiente')).toBe(true);
    expect(existe(renderer, 'cambiar-estado-en_progreso')).toBe(true);
    expect(existe(renderer, 'cambiar-estado-resuelto')).toBe(true);
    expect(existe(renderer, 'boton-editar')).toBe(false);
    expect(existe(renderer, 'boton-eliminar')).toBe(false);
    expect(existe(renderer, 'solo-lectura')).toBe(false);
  });

  test('un residente ajeno solo puede leer', async () => {
    const { renderer } = await montar(crearService(), residenteAjeno);

    expect(existe(renderer, 'solo-lectura')).toBe(true);
    expect(existe(renderer, 'boton-editar')).toBe(false);
    expect(existe(renderer, 'boton-eliminar')).toBe(false);
    expect(existe(renderer, 'cambiar-estado-resuelto')).toBe(false);
  });

  test('el administrador cambia el estado enviando solo { estado }', async () => {
    const service = crearService({
      cambiarEstado: jest.fn(async () => ({
        ok: true as const,
        data: { ...reporteBase, estado: 'resuelto' as const },
      })),
    });
    const { renderer } = await montar(service, adminAjeno);

    await tocar(renderer, 'cambiar-estado-resuelto');

    expect(service.cambiarEstado).toHaveBeenCalledWith(7, 'resuelto');
    expect(textoDe(porId(renderer, 'aviso-estado'))).toBe('Estado actualizado a «Resuelto».');
  });

  test('tocar el estado que ya tiene no llama a la API', async () => {
    const service = crearService();
    const { renderer } = await montar(service, adminAjeno);

    await tocar(renderer, 'cambiar-estado-pendiente');

    expect(service.cambiarEstado).not.toHaveBeenCalled();
  });

  test('un 403 al cambiar el estado muestra el mensaje y no cambia nada', async () => {
    const service = crearService({
      cambiarEstado: jest.fn(async () => falla(403, 'No tienes permiso para esta acción.')),
    });
    const { renderer } = await montar(service, adminAjeno);

    await tocar(renderer, 'cambiar-estado-resuelto');

    expect(textoDe(porId(renderer, 'error-accion'))).toBe('No tienes permiso para esta acción.');
    expect(existe(renderer, 'aviso-estado')).toBe(false);
  });

  test('eliminar pide confirmación, elimina y al aceptar vuelve', async () => {
    const service = crearService();
    const { renderer, onEliminado } = await montar(service, autor);

    await tocar(renderer, 'boton-eliminar');
    expect(alerta.mock.calls[0][0]).toBe('Eliminar reporte');
    expect(service.eliminar).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      alerta.mock.calls[0][2][1].onPress();
    });

    expect(service.eliminar).toHaveBeenCalledWith(7);
    expect(alerta.mock.calls[1][0]).toBe('Reporte eliminado');
    expect(onEliminado).not.toHaveBeenCalled();

    alerta.mock.calls[1][2][0].onPress();
    expect(onEliminado).toHaveBeenCalled();
  });

  test('cancelar la confirmación no elimina', async () => {
    const service = crearService();
    const { renderer } = await montar(service, autor);

    await tocar(renderer, 'boton-eliminar');

    // El botón «Cancelar» no tiene acción: la API no debe llamarse.
    expect(alerta.mock.calls[0][2][0].onPress).toBeUndefined();
    expect(service.eliminar).not.toHaveBeenCalled();
  });

  test('si eliminar falla con 403 muestra el error y no confirma', async () => {
    const service = crearService({
      eliminar: jest.fn(async () => falla(403, 'No tienes permiso para esta acción.')),
    });
    const { renderer, onEliminado } = await montar(service, autor);

    await tocar(renderer, 'boton-eliminar');
    await ReactTestRenderer.act(async () => {
      alerta.mock.calls[0][2][1].onPress();
    });

    expect(textoDe(porId(renderer, 'error-accion'))).toBe('No tienes permiso para esta acción.');
    expect(alerta).toHaveBeenCalledTimes(1);
    expect(onEliminado).not.toHaveBeenCalled();
  });

  test('un 404 al cargar muestra el error sin opción de reintentar', async () => {
    const service = crearService({ obtener: jest.fn(async () => falla(404, 'El reporte ya no existe.')) });
    const { renderer, onVolver } = await montar(service, autor);

    expect(textoDe(porId(renderer, 'error-detalle'))).toBe('El reporte ya no existe.');
    expect(existe(renderer, 'reintentar-detalle')).toBe(false);
    expect(existe(renderer, 'boton-editar')).toBe(false);

    await tocar(renderer, 'boton-volver');
    expect(onVolver).toHaveBeenCalled();
  });

  test('sin conexión al cargar permite reintentar', async () => {
    const obtener = jest
      .fn()
      .mockResolvedValueOnce(falla(0, 'No hay conexión. Revisa tu internet e intenta de nuevo.'))
      .mockResolvedValueOnce({ ok: true, data: reporteBase });
    const { renderer } = await montar(crearService({ obtener }), autor);

    expect(textoDe(porId(renderer, 'error-detalle'))).toBe(
      'No hay conexión. Revisa tu internet e intenta de nuevo.',
    );

    await tocar(renderer, 'reintentar-detalle');

    expect(existe(renderer, 'error-detalle')).toBe(false);
    expect(existe(renderer, 'detalle-titulo')).toBe(true);
  });
});
