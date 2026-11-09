# Reportes: crear y editar (móvil)

Pantalla `ReporteFormScreen` para crear y editar un reporte, con validación por campo y
confirmación al guardar. Está hecha para que no dependa de la navegación, del almacenamiento
del token ni de dónde sale la URL de la API: eso lo resuelven el login y la configuración de la app.

## Piezas

| Archivo | Para qué sirve |
|---|---|
| `ReporteFormScreen.tsx` | Formulario. Sin `reporte` crea; con `reporte` edita (y permite cambiar el estado). |
| `reportesService.ts` | Llama a la API (`GET /categorias`, `POST /reportes`, `PATCH /reportes/:id`) y traduce cada respuesta a un resultado o un mensaje legible. |
| `errores.ts` | Reparte los errores 422 entre los campos y valida título y categoría antes de enviar. |
| `tipos.ts` | Tipos de `Reporte`, `Categoria` y del formulario. |

## Cómo conectarla a la app

La pantalla recibe un `service` creado con un cliente HTTP que cumpla esta interfaz:

```ts
interface Http {
  request(metodo: 'GET' | 'POST' | 'PATCH', ruta: string, cuerpo?: unknown):
    Promise<{ status: number; data: unknown }>;
}
```

- Debe **resolver** con la respuesta aunque el status sea 4xx o 5xx, y **rechazar** solo cuando no hubo conexión.
- `ruta` es relativa (`/reportes`); la URL base y el header `Authorization` los pone el cliente.

```tsx
const service = crearReportesService(http);

<ReporteFormScreen
  service={service}
  reporte={reporteAEditar}            // omitir para crear
  onGuardado={(reporte, accion) => navigation.goBack()}   // se llama al aceptar la confirmación
  onCancelar={() => navigation.goBack()}
/>
```

`onGuardado` es donde se vuelve al listado y se refresca. Si el listado se carga al enfocar la pantalla,
basta con volver.

## Errores

| Respuesta | Qué ve la persona |
|---|---|
| 422 | Un mensaje junto a cada campo (ver `errores.ts`). |
| 403 | El mensaje que manda la API. |
| 404 | "El reporte ya no existe." |
| 401 | "Tu sesión expiró…" (el `status` 401 llega en `error.status` para que el cliente cierre la sesión). |
| Sin conexión | "No hay conexión…" (y las categorías ofrecen reintentar). |
| 5xx | Mensaje genérico, nunca el cuerpo de la respuesta. |

## Nota sobre los mensajes 422

El backend devuelve los errores de validación como una lista de textos en inglés
(`"Titulo can't be blank"`), no como un objeto por campo. `errores.ts` los asigna al campo por el
nombre que aparece al inicio y los traduce. Si el backend cambia su idioma o su formato, ese es el
único archivo que hay que ajustar.

## Tests

```bash
npm test
```

Cubren el reparto de errores 422, el servicio con respuestas simuladas (201, 422, 403, 404, 401, 500 y
sin conexión) y la pantalla (validación local, 422 por campo, 403, confirmación, edición y reintento).
