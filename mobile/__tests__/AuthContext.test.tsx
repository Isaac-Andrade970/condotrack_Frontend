
import React from 'react';
import {Button, Text, View} from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import * as Keychain from 'react-native-keychain';
import api from '../src/api/axios';
import {AuthProvider, useAuth} from '../src/context/AuthContext';

// Simulamos la API y el almacenamiento seguro.
// No realizamos solicitudes reales al backend.
jest.mock('../src/api/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
  setOnUnauthorized: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const mockPost = jest.mocked(api.post);
const mockGetCredentials = jest.mocked(
  Keychain.getGenericPassword,
);

// Este componente utiliza el AuthContext real.
// La API es lo único que simulamos.
function LoginDePrueba() {
  const {login, error} = useAuth();

  return (
    <View>
      <Button
        title="Probar login"
        onPress={() => {
          login('prueba@condotrack.cl', 'clave').catch(() => {});
        }}
      />
      <Text testID="mensaje-login">{error}</Text>
    </View>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCredentials.mockResolvedValue(false);
});

describe('AuthContext - manejo de errores de login', () => {
  const escenarios = [
    {
      caso: '401 - credenciales incorrectas',
      errorSimulado: {
        isAxiosError: true,
        response: {status: 401},
      },
      mensaje: 'Email o contraseña incorrectos.',
    },
    {
      caso: '403 - acceso denegado',
      errorSimulado: {
        isAxiosError: true,
        response: {status: 403},
      },
      mensaje: 'No tienes permiso para realizar esta acción.',
    },
    {
      caso: '404 - servicio no disponible',
      errorSimulado: {
        isAxiosError: true,
        response: {status: 404},
      },
      mensaje: 'El servicio de inicio de sesión no está disponible.',
    },
    {
      caso: '422 - datos inválidos',
      errorSimulado: {
        isAxiosError: true,
        response: {status: 422},
      },
      mensaje: 'Revisa los datos ingresados e intenta nuevamente.',
    },
    {
      caso: '503 - error del servidor',
      errorSimulado: {
        isAxiosError: true,
        response: {status: 503},
      },
      mensaje: 'El servidor no está disponible. Intenta más tarde.',
    },
    {
      caso: 'sin conexión - no hay respuesta HTTP',
      errorSimulado: {
        isAxiosError: true,
        code: 'ERR_NETWORK',
      },
      mensaje: 'No hay conexión. Revisa tu internet e intenta de nuevo.',
    },
    {
      caso: 'error inesperado',
      errorSimulado: new Error('Error desconocido'),
      mensaje: 'No fue posible iniciar sesión. Intenta nuevamente.',
    },
  ];

  test.each(escenarios)(
    '$caso',
    async ({errorSimulado, mensaje}) => {
      mockPost.mockRejectedValue(errorSimulado);

      render(
        <AuthProvider>
          <LoginDePrueba />
        </AuthProvider>,
      );

      fireEvent.press(
        screen.getByText('Probar login'),
      );

      await waitFor(() => {
        expect(screen.getByText(mensaje)).toBeTruthy();
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/login',
        {
          email: 'prueba@condotrack.cl',
          password: 'clave',
        },
      );
    },
  );
});
