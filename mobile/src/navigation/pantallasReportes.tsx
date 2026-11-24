import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import ReporteDetailScreen from '../reportes/ReporteDetailScreen';
import ReporteFormScreen from '../reportes/ReporteFormScreen';
import ReportesListScreen from '../reportes/ReportesListScreen';
import { reportesService } from '../reportes/servicio';
import { RootStackParamList } from './tipos';

type Props<R extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  R
>;

// Las pantallas de reportes no conocen el navegador: reciben callbacks. Estos
// componentes los conectan con React Navigation y con la sesión.
//
// `activa` hace que el listado y el detalle se recarguen al volver a estar a la
// vista, así un reporte creado, editado o eliminado aparece sin cerrar la app.

export function ReportesScreen({ navigation }: Props<'Reportes'>) {
  const { user } = useAuth();
  const activa = useIsFocused();

  return (
    <ReportesListScreen
      service={reportesService}
      usuario={user}
      activa={activa}
      onAbrir={reporte =>
        navigation.navigate('ReporteDetalle', {
          reporteId: reporte.id,
          reporte,
        })
      }
      onNuevo={() => navigation.navigate('ReporteForm', {})}
    />
  );
}

export function ReporteDetalleScreen({
  navigation,
  route,
}: Props<'ReporteDetalle'>) {
  const { user } = useAuth();
  const activa = useIsFocused();

  return (
    <ReporteDetailScreen
      service={reportesService}
      usuario={user}
      reporteId={route.params.reporteId}
      reporteInicial={route.params.reporte}
      activa={activa}
      onEditar={reporte => navigation.navigate('ReporteForm', { reporte })}
      onEliminado={() => navigation.popToTop()}
      onVolver={() => navigation.goBack()}
    />
  );
}

export function ReporteFormularioScreen({
  navigation,
  route,
}: Props<'ReporteForm'>) {
  return (
    <ReporteFormScreen
      service={reportesService}
      reporte={route.params?.reporte}
      // Tras guardar vuelve al listado, que se recarga solo.
      onGuardado={() => navigation.popToTop()}
      onCancelar={() => navigation.goBack()}
    />
  );
}
