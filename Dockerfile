# ── Stage 1: Build ────────────────────────────────────────────────
# Install dependencies and produce a production Vite build (static files in /app/dist)
FROM node:20-alpine AS build
WORKDIR /app

# Copy lockfile first for better Docker layer caching
# (dependencies only re-install when package files change)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
ARG VITE_API_BASE_URL=https://api.newlsun.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────
# Caddy serves the static SPA files with proper client-side routing support
FROM caddy:alpine
COPY --from=build /app/dist /srv
COPY Caddyfile.serve /etc/caddy/Caddyfile
EXPOSE 80
