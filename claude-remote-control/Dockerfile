# 247 Agent Dockerfile
# Runs the agent server with terminal support via tmux

# Node 22 requerido por engines field en package.json
FROM node:22-bookworm-slim

# Install system dependencies:
# - tmux, git, curl, bash: runtime needs
# - python3, make, g++, build-essential: compile native modules
#   (node-pty-prebuilt-multiarch and better-sqlite3)
RUN apt-get update && apt-get install -y \
    tmux \
    git \
    curl \
    bash \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy workspace/root config files (INCLUYENDO tsconfig.json raiz)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./

# Copy package.json de cada workspace (para cache de install)
COPY apps/agent/package.json ./apps/agent/
COPY packages/shared/package.json ./packages/shared/

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/agent/ ./apps/agent/
COPY packages/shared/ ./packages/shared/

# Build: shared PRIMERO, luego agent
RUN pnpm --filter 247-shared build && pnpm --filter 247-agent build

# Create persistent data directory for SQLite
RUN mkdir -p /root/.247/data

# Expose port
EXPOSE 4678

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:4678/health || exit 1

# Start agent
WORKDIR /app/apps/agent
CMD ["node", "dist/index.js"]
