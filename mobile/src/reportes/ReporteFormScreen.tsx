import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { validarDatos } from './errores';
import { ReportesService } from './reportesService';
import {
  Categoria,
  CampoReporte,
  DatosReporte,
  ErroresCampos,
  ESTADOS,
  ETIQUETA_ESTADO,
  Reporte,
} from './tipos';

type Props = {
  service: ReportesService;
  // Si viene un reporte, la pantalla edita; si no, crea.
  reporte?: Reporte;
  // Se llama cuando la persona acepta la confirmación: aquí se vuelve al listado.
  onGuardado: (reporte: Reporte, accion: 'creado' | 'actualizado') => void;
  onCancelar: () => void;
};

function datosIniciales(reporte?: Reporte): DatosReporte {
  return {
    titulo: reporte?.titulo ?? '',
    descripcion: reporte?.descripcion ?? '',
    torre_unidad: reporte?.torre_unidad ?? '',
    categoria_id: reporte?.categoria_id ?? null,
    estado: reporte?.estado ?? 'pendiente',
  };
}

export default function ReporteFormScreen({
  service,
  reporte,
  onGuardado,
  onCancelar,
}: Props) {
  const editando = reporte !== undefined;

  const [datos, setDatos] = useState<DatosReporte>(() => datosIniciales(reporte));
  const [errores, setErrores] = useState<ErroresCampos>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState('');

  const cargarCategorias = useCallback(async () => {
    setCargandoCategorias(true);
    setErrorCategorias('');
    const resultado = await service.listarCategorias();
    if (resultado.ok) {
      setCategorias(resultado.data);
    } else {
      setErrorCategorias(resultado.error.mensaje);
    }
    setCargandoCategorias(false);
  }, [service]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  // Al escribir en un campo se borra su error: ya no corresponde.
  function cambiar<C extends CampoReporte>(campo: C, valor: DatosReporte[C]) {
    setDatos(previos => ({ ...previos, [campo]: valor }));
    setErrores(previos => ({ ...previos, [campo]: undefined }));
    setErrorGeneral('');
  }

  async function guardar() {
    if (guardando) {
      return;
    }

    const erroresLocales = validarDatos(datos);
    if (Object.keys(erroresLocales).length > 0) {
      setErrores(erroresLocales);
      return;
    }

    setGuardando(true);
    setErrores({});
    setErrorGeneral('');

    const resultado = reporte
      ? await service.actualizar(reporte.id, datos)
      : await service.crear(datos);

    setGuardando(false);

    if (!resultado.ok) {
      setErrores(resultado.error.campos);
      setErrorGeneral(resultado.error.mensaje);
      return;
    }

    const accion = editando ? 'actualizado' : 'creado';
    Alert.alert(
      editando ? 'Reporte actualizado' : 'Reporte creado',
      editando
        ? 'Los cambios quedaron guardados.'
        : 'Tu reporte quedó registrado y aparecerá en el listado.',
      [{ text: 'Aceptar', onPress: () => onGuardado(resultado.data, accion) }],
      { cancelable: false },
    );
  }

  return (
    <ScrollView
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo} accessibilityRole="header">
        {editando ? 'Editar reporte' : 'Nuevo reporte'}
      </Text>

      <Text style={styles.etiqueta}>Título</Text>
      <TextInput
        testID="campo-titulo"
        style={[styles.input, errores.titulo && styles.inputError]}
        value={datos.titulo}
        onChangeText={texto => cambiar('titulo', texto)}
        placeholder="Ej. Ascensor detenido"
        editable={!guardando}
      />
      <MensajeError testID="error-titulo" texto={errores.titulo} />

      <Text style={styles.etiqueta}>Descripción</Text>
      <TextInput
        testID="campo-descripcion"
        style={[styles.input, styles.inputLargo, errores.descripcion && styles.inputError]}
        value={datos.descripcion}
        onChangeText={texto => cambiar('descripcion', texto)}
        placeholder="Cuenta qué pasó"
        multiline
        editable={!guardando}
      />
      <MensajeError testID="error-descripcion" texto={errores.descripcion} />

      <Text style={styles.etiqueta}>Torre / Unidad</Text>
      <TextInput
        testID="campo-torre_unidad"
        style={[styles.input, errores.torre_unidad && styles.inputError]}
        value={datos.torre_unidad}
        onChangeText={texto => cambiar('torre_unidad', texto)}
        placeholder="Ej. B-3"
        editable={!guardando}
      />
      <MensajeError testID="error-torre_unidad" texto={errores.torre_unidad} />

      <Text style={styles.etiqueta}>Categoría</Text>
      {cargandoCategorias && <ActivityIndicator testID="cargando-categorias" />}
      {errorCategorias !== '' && (
        <View>
          <MensajeError testID="error-categorias" texto={errorCategorias} />
          <Pressable
            testID="reintentar-categorias"
            accessibilityRole="button"
            style={styles.botonSecundario}
            onPress={cargarCategorias}>
            <Text style={styles.textoSecundario}>Reintentar</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.opciones}>
        {categorias.map(categoria => (
          <Opcion
            key={categoria.id}
            testID={`categoria-${categoria.id}`}
            texto={categoria.nombre}
            seleccionada={datos.categoria_id === categoria.id}
            deshabilitada={guardando}
            onPress={() => cambiar('categoria_id', categoria.id)}
          />
        ))}
      </View>
      <MensajeError testID="error-categoria_id" texto={errores.categoria_id} />

      {editando && (
        <>
          <Text style={styles.etiqueta}>Estado</Text>
          <View style={styles.opciones}>
            {ESTADOS.map(estado => (
              <Opcion
                key={estado}
                testID={`estado-${estado}`}
                texto={ETIQUETA_ESTADO[estado]}
                seleccionada={datos.estado === estado}
                deshabilitada={guardando}
                onPress={() => cambiar('estado', estado)}
              />
            ))}
          </View>
          <MensajeError testID="error-estado" texto={errores.estado} />
        </>
      )}

      <MensajeError testID="error-general" texto={errorGeneral} />

      <Pressable
        testID="boton-guardar"
        accessibilityRole="button"
        accessibilityState={{ disabled: guardando }}
        style={[styles.boton, guardando && styles.botonDeshabilitado]}
        onPress={guardar}
        disabled={guardando}>
        {guardando ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.textoBoton}>
            {editando ? 'Guardar cambios' : 'Crear reporte'}
          </Text>
        )}
      </Pressable>

      <Pressable
        testID="boton-cancelar"
        accessibilityRole="button"
        style={styles.botonSecundario}
        onPress={onCancelar}
        disabled={guardando}>
        <Text style={styles.textoSecundario}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

function MensajeError({ testID, texto }: { testID: string; texto?: string }) {
  if (!texto) {
    return null;
  }
  return (
    <Text testID={testID} style={styles.error} accessibilityRole="alert">
      {texto}
    </Text>
  );
}

type OpcionProps = {
  testID: string;
  texto: string;
  seleccionada: boolean;
  deshabilitada: boolean;
  onPress: () => void;
};

function Opcion({ testID, texto, seleccionada, deshabilitada, onPress }: OpcionProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionada, disabled: deshabilitada }}
      style={[styles.opcion, seleccionada && styles.opcionSeleccionada]}
      onPress={onPress}
      disabled={deshabilitada}>
      <Text style={[styles.textoOpcion, seleccionada && styles.textoOpcionSeleccionada]}>
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#ffffff' },
  contenido: { padding: 20, paddingBottom: 40 },
  titulo: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  inputLargo: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: '#b91c1c' },
  error: { color: '#b91c1c', fontSize: 13, marginTop: 4 },
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
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  botonSecundario: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  textoSecundario: { color: '#1d4ed8', fontSize: 15, fontWeight: '600' },
});
