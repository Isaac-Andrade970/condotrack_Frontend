# CondoTrack — Frontend

Interfaz web en React para el sistema de reporte y seguimiento de incidencias de un
condominio (CondoTrack). Permite a los residentes iniciar sesión, crear reportes,
clasificarlos por categoría, ver su estado y comentarlos.

## Problema que resuelve

En condominios y edificios, los residentes reportan fallas (ascensores, filtraciones,
luminarias, ruidos molestos, áreas comunes dañadas) por canales informales — WhatsApp,
conversaciones con el conserje, un cuaderno físico — sin trazabilidad ni métricas.
CondoTrack les da una plataforma única donde reportar, hacer seguimiento del estado en
tiempo real, y a conserjería/administración gestionar los casos desde un panel
centralizado. En esta etapa (Tarea 1) no hay roles diferenciados: cualquier usuario
autenticado puede operar los 3 recursos.

## Arquitectura

```
┌─────────────────────┐
│   Web Frontend        │
│   React (Vite)          │  ← este repo
└──────────┬───────────┘
           │ REST / JSON (JWT en header Authorization)
           ▼
┌─────────────────────┐
│   Backend              │
│   Ruby on Rails 8.1      │  (condotrack_Backend)
└──────────┬───────────┘
           ▼
┌─────────────────────┐
│   PostgreSQL            │
└─────────────────────┘
```

El token JWT se guarda en `localStorage` (`AuthContext`) y se agrega automáticamente a
cada request vía un interceptor de axios (`src/api/axios.js`).

## Modelo de datos

Consumido tal cual desde la API — ver el detalle completo en el README de
[`condotrack_Backend`](https://github.com/Isaac-Andrade970/condotrack_Backend#modelo-de-datos):
`User` (1:N) `Reporte` (N:1) `Categoria`, `Reporte` (1:N) `Comentario`.

## Stack

- React + Vite
- React Router
- Axios (comunicación con el backend)

## Requisitos previos

- Node.js (versión LTS)
- El backend de CondoTrack corriendo (local o la URL de producción)

## Instalación

```bash
npm install
```

## Configuración

Copia `.env.example` a `.env` y ajusta la URL del backend:

```bash
cp .env.example .env
```

```
VITE_API_URL=https://apicondotrack.frubilarz.cl
```

Para desarrollo contra un backend local, usa `VITE_API_URL=http://localhost:3000`.

## Levantar el proyecto

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Build de producción

```bash
npm run build
```

## Lint

```bash
npm run lint
```

No hay tests automatizados todavía en este repo.

## Producción

Frontend: aún no desplegado — pendiente (Vercel/Netlify).
Backend (API): <https://apicondotrack.frubilarz.cl>

## Credenciales de prueba

No hay usuarios precargados. Regístrate desde `/register` con cualquier email — el
registro es abierto (no requiere aprobación).

## Funcionalidades

- Registro e inicio de sesión (JWT)
- CRUD de Categorías
- CRUD de Reportes, con selector de categoría y estado (pendiente / en_progreso / resuelto)
- Comentarios por reporte
