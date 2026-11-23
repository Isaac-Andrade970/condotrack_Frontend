import api, { notificarNoAutorizado } from './axios';
import { Http } from '../reportes/reportesService';

// Adaptador entre axios y el contrato `Http` que usa el servicio de reportes:
// resuelve con la respuesta aunque el status sea 4xx o 5xx (validateStatus) y solo rechaza
// cuando no hubo conexión. Usa el mismo cliente que el login, así que el token del Keychain
// y la URL de la API (API_URL) se aplican igual.
export const http: Http = {
  async request(metodo, ruta, cuerpo) {
    const respuesta = await api.request({
      method: metodo,
      url: ruta,
      data: cuerpo,
      validateStatus: () => true,
    });

    // Con validateStatus el interceptor de errores de axios nunca ve un 401,
    // así que aquí se avisa para volver al login igual que en el resto de la app.
    if (respuesta.status === 401) {
      notificarNoAutorizado();
    }

    return { status: respuesta.status, data: respuesta.data };
  },
};
