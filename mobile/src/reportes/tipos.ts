export const ESTADOS = ['pendiente', 'en_progreso', 'resuelto'] as const;
export type Estado = (typeof ESTADOS)[number];

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  resuelto: 'Resuelto',
};

export type Categoria = {
  id: number;
  nombre: string;
  descripcion?: string | null;
};

// Forma en que la API devuelve un reporte (GET/POST/PATCH /reportes).
export type Reporte = {
  id: number;
  titulo: string;
  descripcion: string | null;
  estado: Estado;
  torre_unidad: string | null;
  categoria_id: number;
  usuario_id: number;
};

// Lo que escribe la persona en el formulario.
export type DatosReporte = {
  titulo: string;
  descripcion: string;
  torre_unidad: string;
  categoria_id: number | null;
  estado: Estado;
};

export type CampoReporte = keyof DatosReporte;

// Un mensaje de error por campo, para mostrarlo junto al campo.
export type ErroresCampos = Partial<Record<CampoReporte, string>>;
