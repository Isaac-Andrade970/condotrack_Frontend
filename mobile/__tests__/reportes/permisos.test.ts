import {
  esAdministrador,
  puedeCambiarSoloEstado,
  puedeEditar,
  puedeEliminar,
} from '../../src/reportes/permisos';
import { reporteBase } from '../../test-utils/ayudas';

const autor = { id: 1, rol: 'residente' };
const otroResidente = { id: 2, rol: 'residente' };
const admin = { id: 3, rol: 'administrador' };
const adminAutor = { id: 1, rol: 'administrador' };

describe('permisos de reportes por rol', () => {
  test('el autor puede editar y eliminar, pero no tiene cambio de estado aparte', () => {
    expect(puedeEditar(autor, reporteBase)).toBe(true);
    expect(puedeEliminar(autor, reporteBase)).toBe(true);
    expect(puedeCambiarSoloEstado(autor, reporteBase)).toBe(false);
  });

  test('un residente ajeno no puede hacer nada', () => {
    expect(puedeEditar(otroResidente, reporteBase)).toBe(false);
    expect(puedeEliminar(otroResidente, reporteBase)).toBe(false);
    expect(puedeCambiarSoloEstado(otroResidente, reporteBase)).toBe(false);
  });

  test('un administrador ajeno solo puede cambiar el estado', () => {
    expect(puedeEditar(admin, reporteBase)).toBe(false);
    expect(puedeEliminar(admin, reporteBase)).toBe(false);
    expect(puedeCambiarSoloEstado(admin, reporteBase)).toBe(true);
  });

  test('un administrador que es autor edita y elimina como cualquier autor', () => {
    expect(puedeEditar(adminAutor, reporteBase)).toBe(true);
    expect(puedeEliminar(adminAutor, reporteBase)).toBe(true);
    expect(puedeCambiarSoloEstado(adminAutor, reporteBase)).toBe(false);
  });

  test('sin sesión no hay permisos', () => {
    expect(puedeEditar(null, reporteBase)).toBe(false);
    expect(puedeEliminar(undefined, reporteBase)).toBe(false);
    expect(esAdministrador(null)).toBe(false);
  });

  test('si el usuario no trae rol se trata como residente', () => {
    expect(esAdministrador({ id: 9 })).toBe(false);
  });
});
