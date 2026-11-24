# CondoTrack — Aplicación móvil (React Native)

Aplicación Android de **CondoTrack**, sistema de seguimiento de incidencias de un condominio. Consume la API REST de Ruby on Rails, utiliza autenticación JWT y contempla los roles `residente` y `administrador`.

> **Alcance:** este README documenta la configuración y las reglas de permisos del proyecto. Algunas pantallas de reportes pueden requerir la integración de las ramas del equipo; verificar el estado de los PR antes de afirmar que el flujo completo está disponible en `main`.

## 1. Tecnologías y estructura

- React Native CLI **0.88** con TypeScript.
- React Navigation para la navegación entre pantallas.
- Axios para conectar con la API REST.
- `react-native-keychain` para almacenar el JWT de manera segura.
- `react-native-config` para leer `API_URL` desde `.env`.
- Jest para pruebas automatizadas.

El frontend web está en la raíz del repositorio; **la app móvil está en `mobile/`**. Los comandos de este documento se ejecutan dentro de `mobile/`.

## 2. Requisitos previos

- **Node.js 22.11 o superior**, según `mobile/package.json`, y npm.
- **Android Studio**, Android SDK y un emulador Android configurado (o un dispositivo Android con depuración USB).
- **JDK 17** y entorno de compilación Android configurado conforme a la guía oficial de React Native.
- Git y acceso a internet para instalar las dependencias.
- API de CondoTrack disponible, ya sea en el servidor publicado o localmente.

El proyecto Android utiliza `compileSdkVersion = 37` y `minSdkVersion = 24`.

Guía oficial de preparación del entorno: https://reactnative.dev/docs/set-up-your-environment

## 3. Instalación en Windows

Clonar el repositorio si todavía no existe:

```powershell
git clone https://github.com/Isaac-Andrade970/condotrack_Frontend.git
cd condotrack_Frontend\mobile
npm.cmd ci
```

Si ya tienes el proyecto en la ruta de trabajo utilizada por el equipo:

```powershell
cd C:\ct\front\condotrack_Frontend\mobile
npm.cmd ci
```

`npm ci` utiliza el `package-lock.json` existente e instala las versiones definidas por el equipo. Si PowerShell bloquea `npm.ps1` o `npx.ps1`, utiliza los ejecutables `npm.cmd` y `npx.cmd` como en los ejemplos.

## 4. Configuración de la API (`.env`)

Desde `mobile/`, copiar el archivo de ejemplo:

```powershell
Copy-Item .env.example .env
```

Abrir `mobile/.env` y dejar exactamente esta variable, sin comillas ni espacios iniciales:

```dotenv
API_URL=https://apicondotrack.frubilarz.cl
```

La aplicación obtiene la URL desde `Config.API_URL` (`mobile/src/api/axios.ts`), por medio de `react-native-config`. No se debe escribir la URL directamente en las pantallas.

Si el backend de Rails corre **localmente** en tu computador (`localhost:3000`), para el **emulador Android estándar** utiliza:

```dotenv
API_URL=http://10.0.2.2:3000
```

`10.0.2.2` es la dirección que usa el emulador Android para llegar al `localhost` del computador anfitrión. Un dispositivo físico requiere una dirección accesible por red y la configuración de seguridad correspondiente.

**Seguridad:** `mobile/.env` está excluido por `mobile/.gitignore`. No subir contraseñas, JWT ni otras credenciales al repositorio. Después de modificar `.env`, volver a compilar la aplicación Android para que la configuración nativa se actualice.

## 5. Ejecutar la aplicación en Android

1. Abrir Android Studio y arrancar un emulador Android; esperar a que termine de iniciar.
2. Abrir **dos terminales** en `mobile/`.
3. En la **terminal 1**, iniciar Metro:

```powershell
npx.cmd react-native start
```

4. En la **terminal 2**, compilar e instalar en el emulador (sin lanzar un segundo Metro):

```powershell
npx.cmd react-native run-android --no-packager
```

La primera compilación puede demorar más porque Gradle descarga y construye dependencias. El resultado esperado es `BUILD SUCCESSFUL` y la aplicación abierta en el emulador.

Si se necesita reiniciar el caché de Metro, cerrar Metro y ejecutar `npx.cmd react-native start --reset-cache`. Si el puerto `8081` está ocupado, comprobar que no haya otra instancia de Metro antes de iniciar una nueva.

## 6. Inicio de sesión y almacenamiento seguro

- El usuario inicia sesión mediante `POST /login` con correo y contraseña.
- El backend devuelve un token JWT y los datos del usuario, incluido `rol`.
- La app guarda el token mediante **Keychain/Keystore**, no en AsyncStorage ni en un archivo de texto plano.
- Axios agrega `Authorization: Bearer <token>` en solicitudes autenticadas.
- Al abrir la aplicación con un token guardado, se consulta `GET /me` para restaurar la sesión.
- Una respuesta HTTP `401` en una ruta protegida activa el cierre de sesión; `401` en `/login` o `/signup` no cierra una sesión previa por sí solo.
- El botón **Cerrar sesión** elimina el token guardado.

Los archivos relevantes son `src/context/AuthContext.tsx`, `src/api/axios.ts` y `src/navigation/AppNavigator.tsx`.

## 7. Usuarios de prueba (solo desarrollo)

En el backend **local**, después de ejecutar `bin/rails db:seed`, están disponibles los siguientes usuarios de ejemplo:

| Rol | Correo | Contraseña (solo desarrollo) |
|---|---|---|
| Administrador | `admin@condotrack.cl` | `password123` |
| Residente | `demo@condotrack.cl` | `password123` |
| Residente | `vecino@condotrack.cl` | `password123` |

Estas credenciales corresponden a los **seeds de desarrollo** del backend. **No se debe asumir que funcionan en producción.** En producción el administrador se configura con una contraseña propia y los residentes pueden registrarse a través de la web. Nunca publicar una contraseña real de producción.

Repositorio y documentación de API: https://github.com/Isaac-Andrade970/condotrack_Backend

## 8. Matriz de permisos por rol

La tabla representa las **reglas de autorización aplicadas por la API**. La visibilidad de los botones en la app depende de las pantallas que estén integradas en la versión instalada.

| Acción | Sin sesión | Residente | Administrador |
|---|---|---|---|
| Iniciar sesión | Sí | Sí | Sí |
| Ver reportes y categorías | `401` | Sí | Sí |
| Crear reporte | `401` | Sí | Sí |
| Editar o eliminar **su propio reporte** | `401` | Sí | Sí |
| Editar o eliminar **reporte ajeno** | `401` | `403` | `403` |
| Cambiar **solo el estado** de un reporte ajeno | `401` | `403` | Sí |
| Ver y crear comentarios | `401` | Sí | Sí |
| Editar o eliminar **su propio comentario** | `401` | Sí | Sí |
| Editar o eliminar **comentario ajeno** | `401` | `403` | `403` |
| Crear, editar o eliminar categorías | `401` | `403` | Sí |

**Importante:** ocultar un botón no reemplaza la seguridad del backend. El servidor siempre debe rechazar una acción no autorizada con `403`.

Estados de un reporte: `pendiente`, `en_progreso` y `resuelto`.

## 9. Manejo de errores

| Caso | Comportamiento esperado |
|---|---|
| `401` | Sesión ausente/expirada: regresar al login en rutas protegidas. |
| `403` | Informar que el usuario no tiene permisos para la acción. |
| `404` | Indicar que el recurso no existe o ya no está disponible. |
| `422` | Mostrar errores de validación junto a los campos correspondientes. |
| Sin conexión | Mostrar un mensaje comprensible y ofrecer reintentar donde corresponda. |
| Cargando | Mostrar un indicador y evitar solicitudes duplicadas. |

La gestión de errores del formulario de reportes está explicada en [`src/reportes/README.md`](src/reportes/README.md). La cobertura transversal de errores de toda la app corresponde a las issues [#44](https://github.com/Isaac-Andrade970/condotrack_Frontend/issues/44) y [#46](https://github.com/Isaac-Andrade970/condotrack_Frontend/issues/46); no se debe dar por completada sin pruebas de integración.

## 10. Pruebas y calidad

Ejecutar los siguientes comandos desde `mobile/`:

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd test -- --watch=false --runInBand
```

- TypeScript: comprueba los tipos.
- ESLint: comprueba las reglas de calidad del código.
- Jest: ejecuta los tests automatizados disponibles.

Para validar manualmente la app, probar al menos: campos vacíos en login, credenciales incorrectas y correctas, logout, persistencia de sesión y, una vez integradas las pantallas de reportes, los permisos diferenciados entre residente y administrador.

## 11. Referencias del proyecto

- [Repositorio frontend y móvil](https://github.com/Isaac-Andrade970/condotrack_Frontend)
- [Repositorio backend y reglas de autorización](https://github.com/Isaac-Andrade970/condotrack_Backend)
- [Documentación del formulario de reportes](src/reportes/README.md)
- [Issue #47 — README móvil](https://github.com/Isaac-Andrade970/condotrack_Frontend/issues/47)
- [Guía de entorno React Native](https://reactnative.dev/docs/set-up-your-environment)
