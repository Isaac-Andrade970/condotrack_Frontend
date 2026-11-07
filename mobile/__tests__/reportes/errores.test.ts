import { repartirErroresDeApi, validarDatos } from '../../src/reportes/errores';
import { DatosReporte } from '../../src/reportes/tipos';

const datosValidos: DatosReporte = {
  titulo: 'Ascensor detenido',
  descripcion: '',
  torre_unidad: 'B-3',
  categoria_id: 2,
  estado: 'pendiente',
};

describe('repartirErroresDeApi', () => {
  // Mensajes reales que devuelve Rails (full_messages) en un 422.
  test('asigna cada mensaje de la API a su campo y lo traduce', () => {
    const { campos, generales } = repartirErroresDeApi([
      "Titulo can't be blank",
      'Categoria must exist',
      'Estado is not included in the list',
    ]);

    expect(campos.titulo).toBe('El título no puede estar vacío');
    expect(campos.categoria_id).toBe('La categoría no es válida, elige una de la lista');
    expect(campos.estado).toBe('El estado no tiene un valor válido');
    expect(generales).toEqual([]);
  });

  test('reconoce el campo torre_unidad aunque Rails lo escriba con espacio', () => {
    const { campos } = repartirErroresDeApi(["Torre unidad can't be blank"]);

    expect(campos.torre_unidad).toBe('La torre o unidad no puede estar vacío');
  });

  test('un mensaje que no es de un campo del formulario queda como general', () => {
    const { campos, generales } = repartirErroresDeApi(['Usuario must exist']);

    expect(campos).toEqual({});
    expect(generales).toEqual(['Usuario must exist']);
  });

  test('si un campo tiene varios errores se queda con el primero', () => {
    const { campos } = repartirErroresDeApi([
      "Titulo can't be blank",
      'Titulo is not included in the list',
    ]);

    expect(campos.titulo).toBe('El título no puede estar vacío');
  });

  test('un motivo desconocido se deja tal cual, sin perder el mensaje', () => {
    const { campos } = repartirErroresDeApi(['Titulo is too long (maximum is 50 characters)']);

    expect(campos.titulo).toBe('El título is too long (maximum is 50 characters)');
  });
});

describe('validarDatos', () => {
  test('datos completos no tienen errores', () => {
    expect(validarDatos(datosValidos)).toEqual({});
  });

  test('exige título (también si son solo espacios) y categoría', () => {
    const errores = validarDatos({ ...datosValidos, titulo: '   ', categoria_id: null });

    expect(errores.titulo).toBe('El título no puede estar vacío');
    expect(errores.categoria_id).toBe('Elige una categoría');
  });

  test('descripción y torre/unidad son opcionales', () => {
    const errores = validarDatos({ ...datosValidos, descripcion: '', torre_unidad: '' });

    expect(errores).toEqual({});
  });
});
