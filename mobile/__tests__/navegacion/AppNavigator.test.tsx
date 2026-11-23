/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AppNavigator from '../../src/navigation/AppNavigator';
import { useAuth } from '../../src/context/AuthContext';
import { reportesService } from '../../src/reportes/servicio';
import {
  existe,
  porId,
  Renderer,
  textoDe,
  tocar,
} from '../../test-utils/ayudas';

// Recorrido con el navegador real: Login o listado según la sesión, y del listado
// al detalle y al formulario. El servicio de reportes y la sesión están simulados.
jest.mock('../../src/context/AuthContext', () => ({ useAuth: jest.fn() }));

jest.mock('../../src/reportes/servicio', () => ({
  reportesService: require('../../test-utils/ayudas').crearService(),
}));

jest.mock('../../src/screens/LoginScreen', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: () => <Text testID="pantalla-login">Login</Text>,
  };
});

const usuario = { id: 1, email: 'autor@test.cl', rol: 'residente' };

function sesion(isLoggedIn: boolean, loading = false) {
  (useAuth as jest.Mock).mockReturnValue({
    user: isLoggedIn ? usuario : null,
    isLoggedIn,
    loading,
    error: '',
    login: jest.fn(),
    logout: jest.fn(),
  });
}

// La lista (FlatList) actualiza su estado con un temporizador interno de ~50 ms.
// Se espera dentro de act para que ese aviso no ensucie la salida de los tests.
async function asentar() {
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolver => setTimeout(resolver, 80));
  });
}

async function ir(renderer: Renderer, testID: string) {
  await tocar(renderer, testID);
  await asentar();
}

async function montar() {
  let renderer!: Renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<AppNavigator />);
  });
  await asentar();
  return renderer;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AppNavigator', () => {
  test('sin sesión muestra el login y no pide reportes', async () => {
    sesion(false);

    const renderer = await montar();

    expect(existe(renderer, 'pantalla-login')).toBe(true);
    expect(reportesService.listar).not.toHaveBeenCalled();
  });

  test('con sesión muestra el listado de reportes', async () => {
    sesion(true);

    const renderer = await montar();

    expect(existe(renderer, 'pantalla-login')).toBe(false);
    expect(reportesService.listar).toHaveBeenCalled();
    expect(textoDe(porId(renderer, 'reporte-7'))).toContain(
      'Ascensor detenido',
    );
  });

  test('del listado se llega al detalle del reporte', async () => {
    sesion(true);
    const renderer = await montar();

    await ir(renderer, 'reporte-7');

    expect(textoDe(porId(renderer, 'detalle-titulo'))).toContain(
      'Ascensor detenido',
    );
    expect(reportesService.obtener).toHaveBeenCalledWith(7);
  });

  test('del listado se llega al formulario de un reporte nuevo', async () => {
    sesion(true);
    const renderer = await montar();

    await ir(renderer, 'boton-nuevo');

    expect(existe(renderer, 'campo-titulo')).toBe(true);
    expect(existe(renderer, 'boton-guardar')).toBe(true);
  });

  test('del detalle el autor llega al formulario de edición con sus datos', async () => {
    sesion(true);
    const renderer = await montar();
    await ir(renderer, 'reporte-7');

    await ir(renderer, 'boton-editar');

    expect(porId(renderer, 'campo-titulo').props.value).toBe(
      'Ascensor detenido',
    );
  });
});
