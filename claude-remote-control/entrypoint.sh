#!/bin/sh
set -e

mkdir -p /root/.247/data
mkdir -p /root/projects
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

# ── Config del agent si no existe ──
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
fi

# ── Validar variables de entorno requeridas ──
if [ -z "$OPENROUTER_API_KEY" ] && [ -z "$OLLAMA_BASE_URL" ]; then
  echo "[entrypoint] ERROR: Debes configurar al menos OPENROUTER_API_KEY o OLLAMA_BASE_URL"
  echo "  fly secrets set OPENROUTER_API_KEY=sk-or-xxx"
  echo "  fly secrets set OLLAMA_BASE_URL=http://mi-ollama:11434"
  exit 1
fi

[ -n "$OPENROUTER_API_KEY" ] && echo "[entrypoint] OpenRouter: OK"
[ -n "$OLLAMA_BASE_URL" ]    && echo "[entrypoint] Ollama URL: $OLLAMA_BASE_URL"

echo "[entrypoint] Iniciando supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
