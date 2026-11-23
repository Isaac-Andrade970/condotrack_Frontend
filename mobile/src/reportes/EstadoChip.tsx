import { StyleSheet, Text, View } from 'react-native';
import { Estado, ETIQUETA_ESTADO } from './tipos';

const COLORES: Record<Estado, { fondo: string; texto: string }> = {
  pendiente: { fondo: '#fef3c7', texto: '#92400e' },
  en_progreso: { fondo: '#dbeafe', texto: '#1e40af' },
  resuelto: { fondo: '#d1fae5', texto: '#065f46' },
};
const NEUTRO = { fondo: '#e5e7eb', texto: '#374151' };

type Props = { estado: Estado; testID?: string };

// Etiqueta de color con el estado del reporte. Si la API manda un estado que la app
// no conoce, se muestra tal cual en gris en vez de fallar.
export default function EstadoChip({ estado, testID }: Props) {
  const color = COLORES[estado] ?? NEUTRO;
  return (
    <View testID={testID} style={[styles.chip, { backgroundColor: color.fondo }]}>
      <Text style={[styles.texto, { color: color.texto }]}>
        {ETIQUETA_ESTADO[estado] ?? String(estado)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  texto: { fontSize: 12, fontWeight: '600' },
});
