import { Reporte } from '../reportes/tipos';

// Pantallas del navegador y los parámetros que recibe cada una.
// Los parámetros deben ser serializables: por eso se pasa el reporte y no funciones.
export type RootStackParamList = {
  Login: undefined;
  Reportes: undefined;
  // `reporte` es el que se muestra al instante mientras el detalle se actualiza desde la API.
  ReporteDetalle: { reporteId: number; reporte?: Reporte };
  // Sin `reporte` crea; con `reporte` edita.
  ReporteForm: { reporte?: Reporte };
};
