/**
 * @format
 */

import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import ReporteFormScreen from '../../src/reportes/ReporteFormScreen';
import { ReportesService, Resultado } from '../../src/reportes/reportesService';
import { Categoria, Reporte } from '../../src/reportes/tipos';

const categorias: Categoria[] = [
  { id: 1, nombre: 'Ascensores' },
  { id: 2, nombre: 'Filtraciones' },
];

const reporteGuardado: Reporte = {
  id: 7,
  titulo: 'Ascensor detenido',
  descripcion: null,
  estado: 'pendiente',
  torre_unidad: null,
  categoria_id: 1,
  usuario_id: 1,
};

function falla(status: number, mensaje: string, campos = {}): Resultado<never> {
  return { ok: false, error: { status, mensaje, campos } };
}

function crearService(sobrescribir: Partial<ReportesService> = {}): ReportesService {
  return {
    listarCategorias: jest.fn(async () => ({ ok: true as const, data: categorias })),
    crear: jest.fn(async () => ({ ok: true as const, data: reporteGuardado })),
    actualizar: jest.fn(async () => ({ ok: true as const, data: reporteGuardado })),
    ...sobrescribir,
  };
}

async function montar(service: ReportesService, reporte?: Reporte) {
  const onGuardado = jest.fn();
  const onCancelar = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ReporteFormScreen
        service={service}
        reporte={reporte}
        onGuardado={onGuardado}
        onCancelar={onCancelar}
      />,
    );
  });
  return { renderer, onGuardado, onCancelar };
}

// Devuelve el componente (no el nodo nativo) con ese testID.
function porId(renderer: ReactTestRenderer.ReactTestRenderer, testID: string): ReactTestInstance {
  const nodos = renderer.root.findAll(
    n => n.props.testID === testID && typeof n.type !== 'string',
  );
  if (nodos.length === 0) {
    throw new Error(`No existe el elemento con testID "${testID}"`);
  }
  return nodos[0];
}

// Solo cuenta lo que realmente se pinta (nodos nativos): un componente que
// devuelve null conserva su testID en las props, pero no aparece en pantalla.
function existe(renderer: ReactTestRenderer.ReactTestRenderer, testID: string): boolean {
  return (
    renderer.root.findAll(n => n.props.testID === testID && typeof n.type === 'string').length > 0
  );
}

function textoDe(nodo: ReactTestInstance): string {
  return nodo
    .findAll(n => (n.type as string) === 'Text')
    .flatMap(n => n.children)
    .join('');
}

async function escribir(
  renderer: ReactTestRenderer.ReactTestRenderer,
  testID: string,
  texto: string,
) {
  await ReactTestRenderer.act(async () => {
    porId(renderer, testID).props.onChangeText(texto);
  });
}

async function tocar(renderer: ReactTestRenderer.ReactTestRenderer, testID: string) {
  await ReactTestRenderer.act(async () => {
    porId(renderer, testID).props.onPress();
  });
}

describe('ReporteFormScreen', () => {
  let alerta: jest.SpyInstance;

  beforeEach(() => {
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alerta.mockRestore();
  });

  test('muestra las categorías que devuelve la API', async () => {
    const { renderer } = await montar(crearService());

    expect(existe(renderer, 'categoria-1')).toBe(true);
    expect(existe(renderer, 'categoria-2')).toBe(true);
    expect(existe(renderer, 'cargando-categorias')).toBe(false);
  });

  test('con campos vacíos muestra los errores junto a cada campo y no llama a la API', async () => {
    const service = crearService();
    const { renderer } = await montar(service);

    await tocar(renderer, 'boton-guardar');

    expect(textoDe(porId(renderer, 'error-titulo'))).toBe('El título no puede estar vacío');
    expect(textoDe(porId(renderer, 'error-categoria_id'))).toBe('Elige una categoría');
    expect(service.crear).not.toHaveBeenCalled();
    expect(alerta).not.toHaveBeenCalled();
  });

  test('al escribir en un campo se borra su error', async () => {
    const { renderer } = await montar(crearService());
    await tocar(renderer, 'boton-guardar');

    await escribir(renderer, 'campo-titulo', 'Ascensor');

    expect(existe(renderer, 'error-titulo')).toBe(false);
    expect(existe(renderer, 'error-categoria_id')).toBe(true);
  });

  test('crea el reporte, muestra la confirmación y al aceptarla vuelve al listado', async () => {
    const service = crearService();
    const { renderer, onGuardado } = await montar(service);

    await escribir(renderer, 'campo-titulo', 'Ascensor detenido');
    await tocar(renderer, 'categoria-1');
    await tocar(renderer, 'boton-guardar');

    expect(service.crear).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Ascensor detenido', categoria_id: 1 }),
    );
    expect(alerta).toHaveBeenCalledTimes(1);
    expect(alerta.mock.calls[0][0]).toBe('Reporte creado');
    // Todavía no vuelve: espera a que la persona acepte la confirmación.
    expect(onGuardado).not.toHaveBeenCalled();

    alerta.mock.calls[0][2][0].onPress();

    expect(onGuardado).toHaveBeenCalledWith(reporteGuardado, 'creado');
  });

  test('un 422 de la API se muestra junto al campo correspondiente', async () => {
    const service = crearService({
      crear: jest.fn(async () =>
        falla(422, 'Revisa los campos marcados.', {
          titulo: 'El título no puede estar vacío',
        }),
      ),
    });
    const { renderer, onGuardado } = await montar(service);

    await escribir(renderer, 'campo-titulo', 'x');
    await tocar(renderer, 'categoria-1');
    await tocar(renderer, 'boton-guardar');

    expect(textoDe(porId(renderer, 'error-titulo'))).toBe('El título no puede estar vacío');
    expect(textoDe(porId(renderer, 'error-general'))).toBe('Revisa los campos marcados.');
    expect(alerta).not.toHaveBeenCalled();
    expect(onGuardado).not.toHaveBeenCalled();
  });

  test('un 403 muestra el mensaje de la API y no confirma', async () => {
    const service = crearService({
      actualizar: jest.fn(async () =>
        falla(403, 'No tienes permiso para modificar este recurso'),
      ),
    });
    const { renderer } = await montar(service, reporteGuardado);

    await tocar(renderer, 'boton-guardar');

    expect(textoDe(porId(renderer, 'error-general'))).toBe(
      'No tienes permiso para modificar este recurso',
    );
    expect(alerta).not.toHaveBeenCalled();
  });

  test('en modo edición carga los datos del reporte y llama a actualizar', async () => {
    const service = crearService();
    const existente: Reporte = {
      ...reporteGuardado,
      titulo: 'Filtración en pasillo',
      categoria_id: 2,
    };
    const { renderer, onGuardado } = await montar(service, existente);

    expect(porId(renderer, 'campo-titulo').props.value).toBe('Filtración en pasillo');
    expect(existe(renderer, 'estado-resuelto')).toBe(true);

    await tocar(renderer, 'estado-resuelto');
    await tocar(renderer, 'boton-guardar');

    expect(service.actualizar).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ titulo: 'Filtración en pasillo', estado: 'resuelto' }),
    );
    expect(service.crear).not.toHaveBeenCalled();
    expect(alerta.mock.calls[0][0]).toBe('Reporte actualizado');

    alerta.mock.calls[0][2][0].onPress();
    expect(onGuardado).toHaveBeenCalledWith(reporteGuardado, 'actualizado');
  });

  test('al crear no se ofrece cambiar el estado', async () => {
    const { renderer } = await montar(crearService());

    expect(existe(renderer, 'estado-resuelto')).toBe(false);
  });

  test('si no cargan las categorías avisa y permite reintentar', async () => {
    const listarCategorias = jest
      .fn()
      .mockResolvedValueOnce(falla(0, 'No hay conexión. Revisa tu internet e intenta de nuevo.'))
      .mockResolvedValueOnce({ ok: true, data: categorias });
    const { renderer } = await montar(crearService({ listarCategorias }));

    expect(textoDe(porId(renderer, 'error-categorias'))).toBe(
      'No hay conexión. Revisa tu internet e intenta de nuevo.',
    );

    await tocar(renderer, 'reintentar-categorias');

    expect(existe(renderer, 'error-categorias')).toBe(false);
    expect(existe(renderer, 'categoria-1')).toBe(true);
  });

  test('cancelar llama a onCancelar sin tocar la API', async () => {
    const service = crearService();
    const { renderer, onCancelar } = await montar(service);

    await tocar(renderer, 'boton-cancelar');

    expect(onCancelar).toHaveBeenCalled();
    expect(service.crear).not.toHaveBeenCalled();
  });
});
