import axios from 'axios';
import Config from 'react-native-config';
import * as Keychain from 'react-native-keychain';

const api = axios.create({
  baseURL: Config.API_URL,
});

api.interceptors.request.use(async config => {
  const credentials = await Keychain.getGenericPassword();
  if (credentials) {
    config.headers.Authorization = `Bearer ${credentials.password}`;
  }
  return config;
});

// Rutas donde un 401 es normal (credenciales incorrectas): ahí no se cierra sesión.
const RUTAS_PUBLICAS = ['/login', '/signup'];

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    if (status === 401 && !RUTAS_PUBLICAS.includes(url) && onUnauthorized) {
      onUnauthorized();
    }

    return Promise.reject(error);
  },
);

export default api;