# ─────────────────────────────────────────────────────────────
# Stage 1: Build — compila agent + web Next.js
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

# Dependencias de sistema para compilar módulos nativos
RUN apt-get update && apt-get install -y \
    python3 make g++ build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm turbo

WORKDIR /app

# Copiar manifiestos primero (cache de capas Docker)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/agent/package.json       ./apps/agent/
COPY apps/web/package.json         ./apps/web/
COPY packages/shared/package.json  ./packages/shared/

# Instalar todas las dependencias (incluyendo devDependencies para build)
RUN pnpm install --frozen-lockfile

# Copiar todo el código fuente
COPY apps/agent/     ./apps/agent/
COPY apps/web/       ./apps/web/
COPY packages/shared/ ./packages/shared/

# Build en orden correcto: shared → agent → web
RUN pnpm --filter 247-shared build
RUN pnpm --filter 247-agent build
RUN pnpm --filter web build

# ─────────────────────────────────────────────────────────────
# Stage 2: Runtime — imagen ligera final
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime

# Runtime deps: tmux (agent), nginx (proxy), supervisord (proceso manager)
RUN apt-get update && apt-get install -y \
    tmux git curl bash \
    nginx \
    supervisor \
    python3 make g++ build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# ── Copiar artefactos del builder ──
# Workspace raíz
COPY --from=builder /app/package.json          ./
COPY --from=builder /app/pnpm-lock.yaml        ./
COPY --from=builder /app/pnpm-workspace.yaml   ./
COPY --from=builder /app/turbo.json            ./
COPY --from=builder /app/tsconfig.json         ./

# Agent (binarios compilados + fuente)
COPY --from=builder /app/apps/agent/           ./apps/agent/
COPY --from=builder /app/packages/shared/      ./packages/shared/

# Web Next.js (solo lo necesario para producción)
COPY --from=builder /app/apps/web/package.json        ./apps/web/
COPY --from=builder /app/apps/web/.next/               ./apps/web/.next/
COPY --from=builder /app/apps/web/public/              ./apps/web/public/
COPY --from=builder /app/apps/web/next.config.js       ./apps/web/next.config.js

# Instalar solo prod deps
RUN pnpm install --frozen-lockfile --prod

# ── Nginx config (reverse proxy) ──
COPY nginx.conf /etc/nginx/nginx.conf

# ── Supervisor config ──
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ── Entrypoint ──
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["/entrypoint.sh"]
