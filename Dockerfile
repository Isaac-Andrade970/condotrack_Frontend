# Imagen de produccion de condotrack_Frontend.
#
# Etapa 1: compila la app con Vite (Node 22). VITE_API_URL se fija en build-time
#          porque Vite la inyecta en el bundle; no se puede cambiar en runtime.
# Etapa 2: sirve `dist/` con nginx (SPA fallback a index.html, ver docker/nginx.conf).
#
# Uso:
#   docker build --build-arg VITE_API_URL=https://apicondotrack.frubilarz.cl -t condotrack-frontend .
#   docker run -d --name condotrack-frontend -p 127.0.0.1:4200:80 condotrack-frontend

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG VITE_API_URL=https://apicondotrack.frubilarz.cl
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
LABEL service=condotrack-frontend
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1
