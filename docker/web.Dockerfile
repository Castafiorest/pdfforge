# PDFForge Web — build static assets with Node, serve with Caddy (also reverse-proxies /api).
# ── Build stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY apps/web apps/web
COPY packages/shared packages/shared
RUN npm run build --workspace=apps/web

# ── Serve stage ──────────────────────────────────────────────────────────
FROM caddy:2-alpine

COPY --from=build /app/apps/web/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
