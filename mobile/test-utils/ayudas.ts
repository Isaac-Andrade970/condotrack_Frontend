import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { ReportesService, Resultado } from '../src/reportes/reportesService';
import { Reporte } from '../src/reportes/tipos';

export type Renderer = ReactTestRenderer.ReactTestRenderer;

export const reporteBase: Reporte = {
  id: 7,
  titulo: 'Ascensor detenido',
  descripcion: 'Se quedó en el piso 3',
  estado: 'pendiente',
  torre_unidad: 'Torre A',
  categoria_id: 1,
  usuario_id: 1,
};

export function falla(status: number, mensaje: string): Resultado<never> {
  return { ok: false, error: { status, mensaje, campos: {} } };
}

export function crearService(sobrescribir: Partial<ReportesService> = {}): ReportesService {
  return {
    listarCategorias: jest.fn(async () => ({
      ok: true as const,
      data: [
        { id: 1, nombre: 'Ascensores' },
        { id: 2, nombre: 'Filtraciones' },
      ],
    })),
    crear: jest.fn(async () => ({ ok: true as const, data: reporteBase })),
    actualizar: jest.fn(async () => ({ ok: true as const, data: reporteBase })),
    listar: jest.fn(async () => ({ ok: true as const, data: [reporteBase] })),
    obtener: jest.fn(async () => ({ ok: true as const, data: reporteBase })),
    cambiarEstado: jest.fn(async () => ({ ok: true as const, data: reporteBase })),
    eliminar: jest.fn(async () => ({ ok: true as const, data: null })),
    ...sobrescribir,
  };
}

// Devuelve el componente (no el nodo nativo) con ese testID.
export function porId(renderer: Renderer, testID: string): ReactTestInstance {
  const nodos = renderer.root.findAll(
    n => n.props.testID === testID && typeof n.type !== 'string',
  );
  if (nodos.length === 0) {
    throw new Error(`No existe el elemento con testID "${testID}"`);
  }
  return nodos[0];
}

// Solo cuenta lo que realmente se pinta (nodos nativos).
export function existe(renderer: Renderer, testID: string): boolean {
  return (
    renderer.root.findAll(n => n.props.testID === testID && typeof n.type === 'string').length > 0
  );
}

export function textoDe(nodo: ReactTestInstance): string {
  return nodo
    .findAll(n => (n.type as string) === 'Text')
    .flatMap(n => n.children)
    .join('');
}

export async function tocar(renderer: Renderer, testID: string) {
  await ReactTestRenderer.act(async () => {
    porId(renderer, testID).props.onPress();
  });
}
