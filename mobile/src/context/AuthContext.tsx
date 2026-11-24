
import React, {createContext, useContext, useEffect, useState} from 'react';
import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import api, {setOnUnauthorized} from '../api/axios';

export type User = {
  id: number;
  email: string;
  nombre?: string;
  rol?: string;
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function logout() {
    await Keychain.resetGenericPassword();
    setUser(null);
    setIsLoggedIn(false);
  }

  useEffect(() => {
    async function restoreSession() {
      const credentials = await Keychain.getGenericPassword();

      if (credentials) {
        setIsLoggedIn(true);

        try {
          const {data} = await api.get('/me');
          setUser(data.user ?? data);
        } catch {
          // Si el token es inválido, el interceptor de 401
          // cierra la sesión.
        }
      }

      setLoading(false);
    }

    restoreSession();

    setOnUnauthorized(() => {
      logout();
    });
  }, []);

  async function login(email: string, password: string) {
    setError('');

    try {
      const {data} = await api.post('/login', {email, password});

      await Keychain.setGenericPassword('token', data.token);

      setUser(data.user);
      setIsLoggedIn(true);
    } catch (err) {
      let mensaje = 'No fue posible iniciar sesión. Intenta nuevamente.';

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (!err.response) {
          mensaje = 'No hay conexión. Revisa tu internet e intenta de nuevo.';
        } else if (status === 401) {
          mensaje = 'Email o contraseña incorrectos.';
        } else if (status === 403) {
          mensaje = 'No tienes permiso para realizar esta acción.';
        } else if (status === 404) {
          mensaje = 'El servicio de inicio de sesión no está disponible.';
        } else if (status === 422) {
          mensaje = 'Revisa los datos ingresados e intenta nuevamente.';
        } else if (status !== undefined && status >= 500) {
          mensaje = 'El servidor no está disponible. Intenta más tarde.';
        }
      }

      setError(mensaje);
      throw err;
    }
  }

  return (
    <AuthContext.Provider
      value={{user, isLoggedIn, loading, error, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
