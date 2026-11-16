import { Reporte } from './tipos';

// Lo único que hace falta saber de la persona para decidir qué opciones ve.
export type UsuarioPermisos = { id: number; rol?: string } | null | undefined;

export function esAdministrador(usuario: UsuarioPermisos): boolean {
  return usuario?.rol === 'administrador';
}

export function esAutor(usuario: UsuarioPermisos, reporte: Reporte): boolean {
  return !!usuario && reporte.usuario_id === usuario.id;
}

// Solo el autor edita el contenido de su reporte y lo elimina (igual que en la API y la web).
export function puedeEditar(usuario: UsuarioPermisos, reporte: Reporte): boolean {
  return esAutor(usuario, reporte);
}

export function puedeEliminar(usuario: UsuarioPermisos, reporte: Reporte): boolean {
  return esAutor(usuario, reporte);
}

// Un administrador puede cambiar el estado de un reporte ajeno, pero nada más:
// ni editar su contenido ni eliminarlo. Si es el autor, ya lo hace desde "Editar".
export function puedeCambiarSoloEstado(usuario: UsuarioPermisos, reporte: Reporte): boolean {
  return esAdministrador(usuario) && !esAutor(usuario, reporte);
}

// Ocultar opciones es solo experiencia de usuario: la autorización real la hace la API,
// que responde 403 si una acción no está permitida.
