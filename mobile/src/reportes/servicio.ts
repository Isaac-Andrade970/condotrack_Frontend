import { http } from '../api/http';
import { crearReportesService } from './reportesService';

// Servicio de reportes de la app: va por el cliente con la URL de .env y el
// token de Keychain. Las pantallas del navegador lo reciben por props.
export const reportesService = crearReportesService(http);
