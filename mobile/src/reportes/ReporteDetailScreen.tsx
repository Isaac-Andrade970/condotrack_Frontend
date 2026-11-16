import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import EstadoChip from './EstadoChip';
import {
  puedeCambiarSoloEstado,
  puedeEditar,
  puedeEliminar,
  UsuarioPermisos,
} from './permisos';
import { ErrorApi, ReportesService } from './reportesService';
import { Categoria, ESTADOS, Estado, ETIQUETA_ESTADO, Reporte } from './tipos';

type Props = {
  service: ReportesService;
  usuario: UsuarioPermisos;
  reporteId: number;
  // Si viene del listado se muestra al instante mientras se actualiza desde la API.
  reporteInicial?: Reporte;
  onEditar: (reporte: Reporte) => void;
  // Se llama cuando la persona acepta la confirmación de que el reporte se eliminó.
  onEliminado: () => void;
  onVolver: () => void;
  // Igual que en el listado: al volver a ser true se recarga (p. ej. después de editar).
  activa?: boolean;
};

export default function ReporteDetailScreen({
  service,
  usuario,
  reporteId,
  reporteInicial,
  onEditar,
  onEliminado,
  onVolver,
  activa = true,
}: Props) {
  const [reporte, setReporte] = useState<Reporte | null>(reporteInicial ?? null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(reporteInicial === undefined);
  const [errorCarga, setErrorCarga] = useState<ErrorApi | null>(null);
  const [errorAccion, setErrorAccion] = useState('');
  const [aviso, setAviso] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    setErrorCarga(null);
    const [detalle, listaCategorias] = await Promise.all([
      service.obtener(reporteId),
      service.listarCategorias(),
    ]);
    if (detalle.ok) {
      setReporte(detalle.data);
    } else {
      setErrorCarga(detalle.error);
      // Si ya no existe no tiene sentido seguir mostrando lo que había.
      if (detalle.error.status === 404) {
        setReporte(null);
      }
    }
    // Si las categorías no cargan, el detalle sigue funcionando: se muestra el número.
    if (listaCategorias.ok) {
      setCategorias(listaCategorias.data);
    }
    setCargando(false);
  }, [service, reporteId]);

  useEffect(() => {
    if (activa) {
      cargar();
    }
  }, [activa, cargar]);

  if (cargando && reporte === null) {
    return (
      <View testID="cargando-detalle" style={styles.centro}>
        <ActivityIndicator />
      </View>
    );
  }

  if (reporte === null) {
    return (
      <View style={styles.pantalla}>
        <View style={styles.contenido}>
          <Text testID="error-detalle" style={styles.error} accessibilityRole="alert">
            {errorCarga?.mensaje ?? 'No se pudo cargar el reporte.'}
          </Text>
          {errorCarga?.status !== 404 && (
            <Pressable
              testID="reintentar-detalle"
              accessibilityRole="button"
              style={styles.botonSecundario}
              onPress={() => {
                setCargando(true);
                cargar();
              }}>
              <Text style={styles.textoSecundario}>Reintentar</Text>
            </Pressable>
          )}
          <Pressable
            testID="boton-volver"
            accessibilityRole="button"
            style={styles.botonSecundario}
            onPress={onVolver}>
            <Text style={styles.textoSecundario}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const actual = reporte;
  const categoria = categorias.find(c => c.id === actual.categoria_id);
  const mostrarEditar = puedeEditar(usuario, actual);
  const mostrarEliminar = puedeEliminar(usuario, actual);
  const mostrarCambioDeEstado = puedeCambiarSoloEstado(usuario, actual);

  function confirmarEliminar() {
    Alert.alert(
      'Eliminar reporte',
      '¿Seguro que quieres eliminar este reporte? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: eliminar },
      ],
    );
  }

  async function eliminar() {
    if (procesando) {
      return;
    }
    setProcesando(true);
    setErrorAccion('');
    setAviso('');

    const resultado = await service.eliminar(actual.id);

    setProcesando(false);
    if (!resultado.ok) {
      setErrorAccion(resultado.error.mensaje);
      return;
    }
    Alert.alert(
      'Reporte eliminado',
      'El reporte se eliminó correctamente.',
      [{ text: 'Aceptar', onPress: onEliminado }],
      { cancelable: false },
    );
  }

  async function cambiarEstado(estado: Estado) {
    if (procesando || estado === actual.estado) {
      return;
    }
    setProcesando(true);
    setErrorAccion('');
    setAviso('');

    const resultado = await service.cambiarEstado(actual.id, estado);

    setProcesando(false);
    if (!resultado.ok) {
      setErrorAccion(resultado.error.mensaje);
      return;
    }
    setReporte(resultado.data);
    setAviso(`Estado actualizado a «${ETIQUETA_ESTADO[estado]}».`);
  }

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenido}>
      <Text testID="detalle-titulo" style={styles.titulo} accessibilityRole="header">
        {actual.titulo}
      </Text>
      <EstadoChip testID="estado-actual" estado={actual.estado} />

      {errorCarga !== null && (
        <Text testID="error-actualizacion" style={styles.error} accessibilityRole="alert">
          {errorCarga.mensaje}
        </Text>
      )}

      <Text style={styles.etiqueta}>Categoría</Text>
      <Text testID="detalle-categoria" style={styles.valor}>
        {categoria?.nombre ?? `Categoría #${actual.categoria_id}`}
      </Text>

      <Text style={styles.etiqueta}>Torre / Unidad</Text>
      <Text testID="detalle-torre" style={styles.valor}>
        {actual.torre_unidad || 'Sin especificar'}
      </Text>

      <Text style={styles.etiqueta}>Descripción</Text>
      <Text testID="detalle-descripcion" style={styles.valor}>
        {actual.descripcion || 'Sin descripción'}
      </Text>

      {mostrarCambioDeEstado && (
        <>
          <Text style={styles.etiqueta}>Cambiar estado</Text>
          <View style={styles.opciones}>
            {ESTADOS.map(estado => (
              <Pressable
                key={estado}
                testID={`cambiar-estado-${estado}`}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: actual.estado === estado,
                  disabled: procesando,
                }}
                style={[styles.opcion, actual.estado === estado && styles.opcionSeleccionada]}
                onPress={() => cambiarEstado(estado)}
                disabled={procesando}>
                <Text
                  style={[
                    styles.textoOpcion,
                    actual.estado === estado && styles.textoOpcionSeleccionada,
                  ]}>
                  {ETIQUETA_ESTADO[estado]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.nota}>
            Como administrador puedes cambiar el estado. El contenido del reporte solo lo edita su
            autor.
          </Text>
        </>
      )}

      {aviso !== '' && (
        <Text testID="aviso-estado" style={styles.aviso}>
          {aviso}
        </Text>
      )}
      {errorAccion !== '' && (
        <Text testID="error-accion" style={styles.error} accessibilityRole="alert">
          {errorAccion}
        </Text>
      )}

      {!mostrarEditar && !mostrarEliminar && !mostrarCambioDeEstado && (
        <Text testID="solo-lectura" style={styles.nota}>
          Solo el autor puede editar o eliminar este reporte.
        </Text>
      )}

      {mostrarEditar && (
        <Pressable
          testID="boton-editar"
          accessibilityRole="button"
          style={[styles.boton, procesando && styles.botonDeshabilitado]}
          onPress={() => onEditar(actual)}
          disabled={procesando}>
          <Text style={styles.textoBoton}>Editar</Text>
        </Pressable>
      )}

      {mostrarEliminar && (
        <Pressable
          testID="boton-eliminar"
          accessibilityRole="button"
          style={[styles.botonPeligro, procesando && styles.botonDeshabilitado]}
          onPress={confirmarEliminar}
          disabled={procesando}>
          {procesando ? (
            <ActivityIndicator color="#b91c1c" />
          ) : (
            <Text style={styles.textoPeligro}>Eliminar</Text>
          )}
        </Pressable>
      )}

      <Pressable
        testID="boton-volver"
        accessibilityRole="button"
        style={styles.botonSecundario}
        onPress={onVolver}>
        <Text style={styles.textoSecundario}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#ffffff' },
  contenido: { padding: 20, paddingBottom: 40 },
  centro: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 10 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 4 },
  valor: { fontSize: 16, color: '#111827' },
  nota: { color: '#6b7280', fontSize: 13, marginTop: 12 },
  error: { color: '#b91c1c', fontSize: 14, marginTop: 12 },
  aviso: { color: '#065f46', fontSize: 14, marginTop: 12 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  opcionSeleccionada: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  textoOpcion: { color: '#374151', fontSize: 14 },
  textoOpcionSeleccionada: { color: '#ffffff', fontWeight: '600' },
  boton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  textoBoton: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  botonPeligro: {
    borderWidth: 1,
    borderColor: '#b91c1c',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  textoPeligro: { color: '#b91c1c', fontSize: 16, fontWeight: '600' },
  botonDeshabilitado: { opacity: 0.6 },
  botonSecundario: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  textoSecundario: { color: '#1d4ed8', fontSize: 15, fontWeight: '600' },
});
