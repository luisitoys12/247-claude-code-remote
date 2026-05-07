#!/bin/sh
set -e

# ── Crear directorios necesarios ──
mkdir -p /root/.247/data
mkdir -p /root/projects
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

# ── Config del agent si no existe (volumen puede estar vacío) ──
CONFIG_FILE="/root/.247/config.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "[entrypoint] Creando config default del agent..."
  cat > "$CONFIG_FILE" << 'EOF'
{
  "machine": {
    "id": "fly-agent",
    "name": "247-fly-agent"
  },
  "agent": {
    "port": 4678
  },
  "projects": {
    "basePath": "/root/projects",
    "whitelist": []
  }
}
EOF
  echo "[entrypoint] Config creado OK"
else
  echo "[entrypoint] Config existente encontrado"
fi

# ── Verificar OPENROUTER_API_KEY ──
if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "[entrypoint] ADVERTENCIA: OPENROUTER_API_KEY no configurado (chat OpenRouter no funcionará)"
fi

echo "[entrypoint] Iniciando supervisord (agent + web + nginx)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
