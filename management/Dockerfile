ARG BASE_REGISTRY=
FROM ${BASE_REGISTRY}node:24-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_ASSET_BASE_URL=
ARG NPM_REGISTRY=https://registry.npmjs.org/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ASSET_BASE_URL=$VITE_ASSET_BASE_URL

COPY management/package*.json ./
RUN npm config set registry "$NPM_REGISTRY" && npm ci

COPY management ./
RUN npm run build

FROM ${BASE_REGISTRY}nginx:1.27-alpine

COPY management/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
