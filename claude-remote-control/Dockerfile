# ─────────────────────────────────────────────────────────────
# Stage 1: Build Node — compila shared + agent
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y \
    python3 make g++ build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm turbo

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/agent/package.json        ./apps/agent/
COPY packages/shared/package.json   ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/agent/      ./apps/agent/
COPY packages/shared/ ./packages/shared/

RUN pnpm --filter 247-shared build
RUN pnpm --filter 247-agent  build

# ─────────────────────────────────────────────────────────────
# Stage 2: Build Python — instala open-webui CPU-only en venv separado
# (stage separado para que el cache de pip no invalide el runtime)
# ─────────────────────────────────────────────────────────────
FROM python:3.11-slim AS pybuilder

RUN apt-get update && apt-get install -y \
    build-essential curl ffmpeg libsm6 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# CPU-only torch + open-webui, sin cache pip
RUN python3 -m venv /opt/webui-venv && \
    /opt/webui-venv/bin/pip install --upgrade pip --no-cache-dir && \
    /opt/webui-venv/bin/pip install --no-cache-dir \
        torch torchvision torchaudio \
        --index-url https://download.pytorch.org/whl/cpu && \
    /opt/webui-venv/bin/pip install --no-cache-dir open-webui

# ─────────────────────────────────────────────────────────────
# Stage 3: Runtime final — solo lo necesario para correr
# ─────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime

# Solo dependencias de runtime, SIN build tools (g++, make, build-essential)
RUN apt-get update && apt-get install -y \
    tmux git curl bash ca-certificates \
    nginx supervisor \
    python3 python3-venv \
    zstd ffmpeg libsm6 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copiar venv con open-webui ya instalado desde pybuilder
COPY --from=pybuilder /opt/webui-venv /opt/webui-venv

# Instalar Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/package.json         ./
COPY --from=builder /app/pnpm-lock.yaml       ./
COPY --from=builder /app/pnpm-workspace.yaml  ./
COPY --from=builder /app/turbo.json           ./
COPY --from=builder /app/tsconfig.json        ./
COPY --from=builder /app/apps/agent/          ./apps/agent/
COPY --from=builder /app/packages/shared/     ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

COPY nginx.conf         /etc/nginx/nginx.conf
COPY supervisord.conf   /etc/supervisor/conf.d/supervisord.conf
COPY entrypoint.sh      /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Volumen unificado: /data/.ollama = modelos, /data/agent = datos, /data/webui = webui
VOLUME ["/data"]

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["/entrypoint.sh"]
