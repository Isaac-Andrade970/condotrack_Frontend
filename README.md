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
centralizado. Hay dos roles, `residente` y `administrador`, con permisos distintos
(ver [Permisos por rol](#permisos-por-rol)).

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
7. **Health Check** - `docker exec condotrack-frontend wget -qO- http://127.0.0.1/health` (Jenkins corre en un
   contenedor y no alcanza el puerto publicado en el host)

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

`vercel.json` lo usa solo Vercel (el despliegue de prueba del equipo, <https://condotrackfrontend.vercel.app>):
redirige todas las rutas a `index.html` para que recargar o abrir directo `/reportes` no dé 404. Antes se
llamaba `versel.json` (con "s"), Vercel no lo leía y esas rutas fallaban. El pipeline de Jenkins no lo usa;
nginx ya hace lo mismo en `docker/nginx.conf`.

## Credenciales de prueba

No hay usuarios precargados. Regístrate desde `/register` con cualquier email — el
registro es abierto (no requiere aprobación).

## Funcionalidades

- Registro e inicio de sesión (JWT)
- Roles `residente` y `administrador`: la interfaz muestra u oculta acciones según el rol
- Categorías: listado para todos; crear, editar y eliminar solo para administradores
- CRUD de Reportes, con selector de categoría y estado (pendiente / en_progreso / resuelto)
- Cambio de estado de reportes ajenos para administradores
- Comentarios por reporte
- Mensajes claros cuando la API responde `403` (sin permiso)

## Permisos por rol

La tabla describe lo que ve y puede hacer cada rol en la web. Coincide con las reglas de la
API (ver el [README del backend](https://github.com/Isaac-Andrade970/condotrack_Backend#permisos-por-rol)).

| Acción | Sin sesión | Residente | Administrador |
|---|---|---|---|
| Registrarse / iniciar sesión | Sí | — | — |
| Ver reportes, categorías y comentarios | Redirige a `/login` | Sí | Sí |
| Crear reporte y comentario | Redirige a `/login` | Sí | Sí |
| Editar o eliminar **su** reporte / comentario | Redirige a `/login` | Sí | Sí |
| Editar o eliminar reporte / comentario **ajeno** | Redirige a `/login` | No (botones ocultos) | No (botones ocultos) |
| Cambiar el **estado** de un reporte ajeno | Redirige a `/login` | No (sin selector) | Sí (selector en la lista) |
| Crear, editar o eliminar categorías | Redirige a `/login` | No (formulario y botones ocultos) | Sí |

Notas:

- El rol viene en `user.rol` (`login`, `signup` y `/me`). `AuthContext` lo expone como `user.rol` y
  como `isAdmin`, y vuelve a consultar `/me` al cargar la app para que una sesión antigua reciba su rol.
- Ocultar botones es solo experiencia de usuario: la autorización real la hace la API. Si una acción
  no permitida llega igual a la API, responde `403` y la web muestra el mensaje que viene en el
  campo `error` del JSON (por ejemplo, «Esta acción es solo para administradores»).
- Un administrador cambia el estado de un reporte ajeno enviando solo `estado`. La API no le permite
  editar el contenido de ese reporte, eliminarlo ni tocar comentarios ajenos.
