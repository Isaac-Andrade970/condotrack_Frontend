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

- Node.js 22 (LTS)
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

- Frontend: <https://condotrack.frubilarz.cl> (droplet de DigitalOcean, mismo host que el backend)
- Backend (API): <https://apicondotrack.frubilarz.cl>

## CI/CD (Jenkins)

La CI del repo es Jenkins, con el mismo esquema que `condotrack_Backend` (no hay workflows
de GitHub Actions). Job: <https://jenkins.frubilarz.cl/job/condotrack-frontend/>
(Multibranch Pipeline sobre este repo; cada rama y PR obtiene su pipeline a partir del
`Jenkinsfile`). Para que el estado del build aparezca como *check* en los PRs, el job
necesita la misma credencial de GitHub que usa el job del backend.

Etapas que corren en **todas las ramas** (dentro de `node:22-alpine`):

1. **Checkout**
2. **Install deps** - `npm ci`
3. **Lint** - `npm run lint` (oxlint)
4. **Build** - `npm run build`
5. **Build image** - `docker build` (ver `Dockerfile`: build de Vite + nginx sirviendo `dist/`)

Solo en la rama **`production`**:

6. **Deploy** - reemplaza el contenedor `condotrack-frontend`, publicado en `127.0.0.1:4200`
7. **Health Check** - `curl -f http://127.0.0.1:4200/health`

`VITE_API_URL` se fija en el `Jenkinsfile` (`https://apicondotrack.frubilarz.cl`) y se
inyecta en el bundle en build-time; no es secreto y no requiere credenciales en Jenkins.
Para desplegar: mergear `main` en `production` y hacer push.

### Configuración del droplet (una sola vez)

1. **Jenkins**: crear el job `condotrack-frontend` (Multibranch Pipeline) apuntando a
   `https://github.com/Isaac-Andrade970/condotrack_Frontend`, con la credencial de GitHub
   y el webhook igual que `condotrack-backend`. Debe existir la red Docker `course-net`
   (ya la usa el backend) y el puerto `4200` libre en el host.
2. **nginx del host**: copiar `docker/condotrack.frubilarz.cl.conf` a
   `/etc/nginx/sites-available/condotrack.frubilarz.cl`, enlazarlo en `sites-enabled`,
   `nginx -t && systemctl reload nginx`.
3. **TLS**: `certbot --nginx -d condotrack.frubilarz.cl` (el DNS ya apunta al droplet).
4. Crear la rama `production` desde `main` y hacer push; Jenkins despliega y el sitio queda
   en <https://condotrack.frubilarz.cl>.

`versel.json` es un remanente de un intento de deploy en Vercel y no lo usa el pipeline.

## Credenciales de prueba

No hay usuarios precargados. Regístrate desde `/register` con cualquier email — el
registro es abierto (no requiere aprobación).

## Funcionalidades

- Registro e inicio de sesión (JWT)
- CRUD de Categorías
- CRUD de Reportes, con selector de categoría y estado (pendiente / en_progreso / resuelto)
- Comentarios por reporte
