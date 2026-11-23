import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import EstadoChip from './EstadoChip';
import { esAutor, UsuarioPermisos } from './permisos';
import { ReportesService } from './reportesService';
import { Reporte } from './tipos';

type Props = {
  service: ReportesService;
  // Persona con sesión iniciada: solo se usa para marcar sus propios reportes.
  usuario: UsuarioPermisos;
  onAbrir: (reporte: Reporte) => void;
  onNuevo: () => void;
  // false mientras la pantalla no está a la vista. Al volver a ser true se recarga el listado,
  // así un reporte recién creado, editado o eliminado aparece sin cerrar la app.
  // Con react-navigation: activa={useIsFocused()}.
  activa?: boolean;
};

export default function ReportesListScreen({
  service,
  usuario,
  onAbrir,
  onNuevo,
  activa = true,
}: Props) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  // Solo es true la primera vez: las recargas siguientes no tapan el listado con un spinner.
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    const resultado = await service.listar();
    if (resultado.ok) {
      setReportes(resultado.data);
    } else {
      setError(resultado.error.mensaje);
    }
    setCargando(false);
    setRefrescando(false);
  }, [service]);

  useEffect(() => {
    if (activa) {
      cargar();
    }
  }, [activa, cargar]);

  function reintentar() {
    setCargando(true);
    cargar();
  }

  function refrescar() {
    setRefrescando(true);
    cargar();
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo} accessibilityRole="header">
          Reportes
        </Text>
        <Pressable
          testID="boton-nuevo"
          accessibilityRole="button"
          style={styles.botonNuevo}
          onPress={onNuevo}>
          <Text style={styles.textoBotonNuevo}>Nuevo reporte</Text>
        </Pressable>
      </View>

      {cargando && (
        <View testID="cargando-listado" style={styles.centro}>
          <ActivityIndicator />
        </View>
      )}

      {!cargando && error !== '' && (
        <View style={styles.bloqueError}>
          <Text testID="error-listado" style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
          <Pressable
            testID="reintentar-listado"
            accessibilityRole="button"
            style={styles.botonSecundario}
            onPress={reintentar}>
            <Text style={styles.textoSecundario}>Reintentar</Text>
          </Pressable>
        </View>
      )}

      {!cargando && error === '' && reportes.length === 0 && (
        <Text testID="sin-reportes" style={styles.vacio}>
          Aún no hay reportes. Crea el primero con «Nuevo reporte».
        </Text>
      )}

      {!cargando && (
        <FlatList
          data={reportes}
          keyExtractor={reporte => String(reporte.id)}
          refreshing={refrescando}
          onRefresh={refrescar}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <Pressable
              testID={`reporte-${item.id}`}
              accessibilityRole="button"
              style={styles.tarjeta}
              onPress={() => onAbrir(item)}>
              <View style={styles.fila}>
                <Text style={styles.tituloReporte} numberOfLines={2}>
                  {item.titulo}
                </Text>
                <EstadoChip estado={item.estado} />
              </View>
              {item.torre_unidad ? (
                <Text style={styles.detalle}>{item.torre_unidad}</Text>
              ) : null}
              {esAutor(usuario, item) && (
                <Text testID={`mio-${item.id}`} style={styles.mio}>
                  Tu reporte
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#ffffff' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 8,
  },
  titulo: { fontSize: 24, fontWeight: '700', color: '#111827' },
  botonNuevo: { backgroundColor: '#1d4ed8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  textoBotonNuevo: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  centro: { padding: 32, alignItems: 'center' },
  bloqueError: { paddingHorizontal: 20, paddingVertical: 12 },
  error: { color: '#b91c1c', fontSize: 14 },
  botonSecundario: { paddingVertical: 12, alignItems: 'flex-start' },
  textoSecundario: { color: '#1d4ed8', fontSize: 15, fontWeight: '600' },
  vacio: { color: '#6b7280', fontSize: 15, paddingHorizontal: 20, paddingTop: 16 },
  lista: { padding: 20, paddingTop: 8, gap: 10 },
  tarjeta: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#ffffff',
  },
  fila: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  tituloReporte: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
  detalle: { color: '#6b7280', fontSize: 13, marginTop: 6 },
  mio: { color: '#1d4ed8', fontSize: 12, fontWeight: '600', marginTop: 6 },
});
