/**
 * @format
 */

import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  ReporteDetalleScreen,
  ReporteFormularioScreen,
  ReportesScreen,
} from '../../src/navigation/pantallasReportes';
import { useAuth } from '../../src/context/AuthContext';
import { reportesService } from '../../src/reportes/servicio';
import {
  existe,
  porId,
  Renderer,
  reporteBase,
  textoDe,
  tocar,
} from '../../test-utils/ayudas';

// El navegador real no se usa aquí: se prueba que cada pantalla quede conectada
// con él (qué ruta abre, con qué parámetros) y con la sesión.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: jest.fn(() => true),
}));

jest.mock('../../src/context/AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('../../src/reportes/servicio', () => ({
  reportesService: require('../../test-utils/ayudas').crearService(),
}));

const autor = { id: 1, email: 'autor@test.cl', rol: 'residente' };

function crearNavegacion() {
  return {
    navigate: jest.fn(),
    popToTop: jest.fn(),
    goBack: jest.fn(),
  };
}

async function montar(elemento: React.ReactElement) {
  let renderer!: Renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(elemento);
  });
  return renderer;
}

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: autor, logout: jest.fn() });
});

describe('ReportesScreen (listado)', () => {
  test('carga los reportes del servicio de la app', async () => {
    const navigation = crearNavegacion();

    const renderer = await montar(
      <ReportesScreen navigation={navigation as never} route={{} as never} />,
    );

    expect(reportesService.listar).toHaveBeenCalled();
    expect(textoDe(porId(renderer, 'reporte-7'))).toContain(
      'Ascensor detenido',
    );
  });

  test('marca como propio el reporte del usuario con sesión', async () => {
    const renderer = await montar(
      <ReportesScreen
        navigation={crearNavegacion() as never}
        route={{} as never}
      />,
    );

    expect(existe(renderer, 'mio-7')).toBe(true);
  });

  test('al tocar un reporte abre el detalle con su id y el reporte', async () => {
    const navigation = crearNavegacion();
    const renderer = await montar(
      <ReportesScreen navigation={navigation as never} route={{} as never} />,
    );

    await tocar(renderer, 'reporte-7');

    expect(navigation.navigate).toHaveBeenCalledWith('ReporteDetalle', {
      reporteId: 7,
      reporte: reporteBase,
    });
  });

  test('«Nuevo reporte» abre el formulario sin reporte (crear)', async () => {
    const navigation = crearNavegacion();
    const renderer = await montar(
      <ReportesScreen navigation={navigation as never} route={{} as never} />,
    );

    await tocar(renderer, 'boton-nuevo');

    expect(navigation.navigate).toHaveBeenCalledWith('ReporteForm', {});
  });
});

describe('ReporteDetalleScreen (detalle)', () => {
  let alerta: jest.SpyInstance;

  beforeEach(() => {
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alerta.mockRestore();
  });

  function montarDetalle(navigation = crearNavegacion()) {
    return montar(
      <ReporteDetalleScreen
        navigation={navigation as never}
        route={{ params: { reporteId: 7, reporte: reporteBase } } as never}
      />,
    ).then(renderer => ({ renderer, navigation }));
  }

  test('pide al servicio el reporte de la ruta', async () => {
    await montarDetalle();

    expect(reportesService.obtener).toHaveBeenCalledWith(7);
  });

  test('el autor edita: abre el formulario con el reporte (editar)', async () => {
    const { renderer, navigation } = await montarDetalle();

    await tocar(renderer, 'boton-editar');

    expect(navigation.navigate).toHaveBeenCalledWith('ReporteForm', {
      reporte: reporteBase,
    });
  });

  test('el autor elimina: al aceptar la confirmación vuelve al listado', async () => {
    const { renderer, navigation } = await montarDetalle();

    await tocar(renderer, 'boton-eliminar');
    await ReactTestRenderer.act(async () => {
      alerta.mock.calls[0][2][1].onPress();
    });
    expect(reportesService.eliminar).toHaveBeenCalledWith(7);
    expect(navigation.popToTop).not.toHaveBeenCalled();

    alerta.mock.calls[1][2][0].onPress();

    expect(navigation.popToTop).toHaveBeenCalled();
  });

  test('«Volver» regresa a la pantalla anterior', async () => {
    const { renderer, navigation } = await montarDetalle();

    await tocar(renderer, 'boton-volver');

    expect(navigation.goBack).toHaveBeenCalled();
  });

  test('un residente ajeno ve el detalle solo de lectura', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 2, email: 'otro@test.cl', rol: 'residente' },
      logout: jest.fn(),
    });

    const { renderer } = await montarDetalle();

    expect(existe(renderer, 'solo-lectura')).toBe(true);
    expect(existe(renderer, 'boton-editar')).toBe(false);
  });

  test('un administrador ajeno solo puede cambiar el estado', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 3, email: 'admin@test.cl', rol: 'administrador' },
      logout: jest.fn(),
    });

    const { renderer } = await montarDetalle();

    expect(existe(renderer, 'cambiar-estado-resuelto')).toBe(true);
    expect(existe(renderer, 'boton-editar')).toBe(false);
    expect(existe(renderer, 'boton-eliminar')).toBe(false);
  });
});

describe('ReporteFormularioScreen (crear y editar)', () => {
  let alerta: jest.SpyInstance;

  beforeEach(() => {
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alerta.mockRestore();
  });

  test('sin reporte en la ruta crea: guarda, confirma y vuelve al listado', async () => {
    const navigation = crearNavegacion();
    const renderer = await montar(
      <ReporteFormularioScreen
        navigation={navigation as never}
        route={{ params: {} } as never}
      />,
    );

    await ReactTestRenderer.act(async () => {
      porId(renderer, 'campo-titulo').props.onChangeText('Ascensor detenido');
    });
    await tocar(renderer, 'categoria-1');
    await tocar(renderer, 'boton-guardar');

    expect(reportesService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Ascensor detenido', categoria_id: 1 }),
    );
    expect(alerta.mock.calls[0][0]).toBe('Reporte creado');
    expect(navigation.popToTop).not.toHaveBeenCalled();

    alerta.mock.calls[0][2][0].onPress();

    expect(navigation.popToTop).toHaveBeenCalled();
  });

  test('con un reporte en la ruta edita: carga sus datos y actualiza', async () => {
    const navigation = crearNavegacion();
    const renderer = await montar(
      <ReporteFormularioScreen
        navigation={navigation as never}
        route={{ params: { reporte: reporteBase } } as never}
      />,
    );

    expect(porId(renderer, 'campo-titulo').props.value).toBe(
      'Ascensor detenido',
    );

    await tocar(renderer, 'boton-guardar');

    expect(reportesService.actualizar).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ titulo: 'Ascensor detenido' }),
    );
    expect(reportesService.crear).not.toHaveBeenCalled();
    expect(alerta.mock.calls[0][0]).toBe('Reporte actualizado');
  });

  test('«Cancelar» regresa sin guardar', async () => {
    const navigation = crearNavegacion();
    const renderer = await montar(
      <ReporteFormularioScreen
        navigation={navigation as never}
        route={{ params: {} } as never}
      />,
    );

    await tocar(renderer, 'boton-cancelar');

    expect(navigation.goBack).toHaveBeenCalled();
    expect(reportesService.crear).not.toHaveBeenCalled();
  });
});
