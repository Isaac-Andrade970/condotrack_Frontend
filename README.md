CondoTrack — Frontend

Interfaz web en React para el sistema de reportes de incidencias de un condominio (CondoTrack). Permite a los residentes iniciar sesión, crear reportes, clasificarlos por categoría, ver su estado y comentarlos.

Stack
React + Vite
React Router
Axios (comunicación con el backend)
Requisitos previos
Node.js (versión LTS)
El backend de CondoTrack corriendo en http://localhost:3000
Instalación
bash
npm install
Configuración

Crear un archivo .env.local en la raíz del proyecto con la URL del backend:

VITE_API_URL=http://localhost:3000
Levantar el proyecto
bash
npm run dev

La app queda disponible en http://localhost:5173.

Funcionalidades
Registro e inicio de sesión
CRUD de Categorías
CRUD de Reportes, con selector de categoría y estado (pendiente / en_progreso / resuelto)
Comentarios por reporte