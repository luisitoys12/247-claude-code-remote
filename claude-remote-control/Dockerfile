# ─────────────────────────────────────────────────────────────
# Stage 1: Build — compila agent + web Next.js
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y \
    python3 make g++ build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm turbo

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/agent/package.json        ./apps/agent/
COPY apps/web/package.json          ./apps/web/
COPY packages/shared/package.json   ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/agent/      ./apps/agent/
COPY apps/web/        ./apps/web/
COPY packages/shared/ ./packages/shared/

# Build en orden: shared → agent → web
RUN pnpm --filter 247-shared build
RUN pnpm --filter 247-agent  build
RUN pnpm --filter web        build

# ─────────────────────────────────────────────────────────────
# Stage 2: Runtime — imagen final con Ollama + nginx + supervisor
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime

# Deps de sistema
RUN apt-get update && apt-get install -y \
    tmux git curl bash ca-certificates \
    nginx supervisor \
    python3 make g++ build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instalar Ollama (binario oficial)
RUN curl -fsSL https://ollama.com/install.sh | sh

RUN npm install -g pnpm

WORKDIR /app

# ── Copiar artefactos del builder ──
COPY --from=builder /app/package.json         ./
COPY --from=builder /app/pnpm-lock.yaml       ./
COPY --from=builder /app/pnpm-workspace.yaml  ./
COPY --from=builder /app/turbo.json           ./
COPY --from=builder /app/tsconfig.json        ./

COPY --from=builder /app/apps/agent/          ./apps/agent/
COPY --from=builder /app/packages/shared/     ./packages/shared/

COPY --from=builder /app/apps/web/package.json     ./apps/web/
COPY --from=builder /app/apps/web/.next/            ./apps/web/.next/
COPY --from=builder /app/apps/web/public/           ./apps/web/public/
COPY --from=builder /app/apps/web/next.config.js    ./apps/web/next.config.js

RUN pnpm install --frozen-lockfile --prod

# ── Configuraciones ──
COPY nginx.conf         /etc/nginx/nginx.conf
COPY supervisord.conf   /etc/supervisor/conf.d/supervisord.conf
COPY entrypoint.sh      /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Directorio de modelos Ollama en volumen persistente
VOLUME ["/root/.ollama"]

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["/entrypoint.sh"]
