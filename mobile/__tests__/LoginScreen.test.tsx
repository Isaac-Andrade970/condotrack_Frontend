
/**
 * @format
 */

import React from 'react';
import {
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';

import LoginScreen from '../src/screens/LoginScreen';
import {useAuth} from '../src/context/AuthContext';

// Simulamos el contexto de autenticación para no
// depender del backend durante las pruebas.
jest.mock('../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockLogin = jest.fn<Promise<void>, [string, string]>();

const authBase = {
  user: null,
  isLoggedIn: false,
  loading: false,
  error: '',
  login: mockLogin,
  logout: jest.fn(async () => {}),
};

// Restablecemos las simulaciones antes de cada prueba.
beforeEach(() => {
  jest.clearAllMocks();
  mockLogin.mockResolvedValue(undefined);
  mockUseAuth.mockReturnValue({...authBase});
});

describe('LoginScreen', () => {
  test('muestra el formulario de inicio de sesión', () => {
    const {getByPlaceholderText, getByRole} = render(
      <LoginScreen />,
    );

    expect(
      getByPlaceholderText('Correo electrónico'),
    ).toBeTruthy();

    expect(
      getByPlaceholderText('Contraseña'),
    ).toBeTruthy();

    expect(
      getByRole('button', {name: 'Iniciar sesión'}),
    ).toBeTruthy();
  });

  test('muestra un error si los campos están vacíos', () => {
    const {getByRole, getByText} = render(
      <LoginScreen />,
    );

    fireEvent.press(
      getByRole('button', {name: 'Iniciar sesión'}),
    );

    expect(
      getByText('Ingresa tu correo y contraseña.'),
    ).toBeTruthy();

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('envía las credenciales correctas al login', async () => {
    const {getByPlaceholderText, getByRole} = render(
      <LoginScreen />,
    );

    fireEvent.changeText(
      getByPlaceholderText('Correo electrónico'),
      'residente@ejemplo.cl',
    );

    fireEvent.changeText(
      getByPlaceholderText('Contraseña'),
      'password123',
    );

    fireEvent.press(
      getByRole('button', {name: 'Iniciar sesión'}),
    );

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'residente@ejemplo.cl',
        'password123',
      );
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  test('elimina espacios exteriores del correo', async () => {
    const {getByPlaceholderText, getByRole} = render(
      <LoginScreen />,
    );

    fireEvent.changeText(
      getByPlaceholderText('Correo electrónico'),
      '  residente@ejemplo.cl  ',
    );

    fireEvent.changeText(
      getByPlaceholderText('Contraseña'),
      'password123',
    );

    fireEvent.press(
      getByRole('button', {name: 'Iniciar sesión'}),
    );

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'residente@ejemplo.cl',
        'password123',
      );
    });
  });

  test('muestra el error de autenticación del contexto', () => {
    mockUseAuth.mockReturnValue({
      ...authBase,
      error: 'Email o contraseña incorrectos.',
    });

    const {getByText} = render(
      <LoginScreen />,
    );

    expect(
      getByText('Email o contraseña incorrectos.'),
    ).toBeTruthy();
  });
});
