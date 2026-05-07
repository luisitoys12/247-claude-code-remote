#!/bin/sh
set -e

# Directorios en el volumen persistente /data
mkdir -p /data/agent
mkdir -p /data/.ollama/models
mkdir -p /root/projects
mkdir -p /var/log/supervisor
mkdir -p /var/log/nginx

# Symlink para que Ollama encuentre sus modelos en el volumen
export OLLAMA_MODELS=/data/.ollama/models

# Config del agent
CONFIG_FILE="/data/agent/config.json"
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
fi

# Info de providers
echo "[entrypoint] Ollama: interno en http://127.0.0.1:11434"
[ -n "$OPENROUTER_API_KEY" ] \
  && echo "[entrypoint] OpenRouter: OK" \
  || echo "[entrypoint] OpenRouter: no configurado (opcional)"

# Pull automatico de modelo en background
if [ -n "$DEFAULT_OLLAMA_MODEL" ]; then
  echo "[entrypoint] Se descargara el modelo '$DEFAULT_OLLAMA_MODEL' tras arrancar Ollama..."
  (
    sleep 15
    ollama pull "$DEFAULT_OLLAMA_MODEL" && \
      echo "[entrypoint] Modelo '$DEFAULT_OLLAMA_MODEL' listo" || \
      echo "[entrypoint] WARN: fallo el pull de '$DEFAULT_OLLAMA_MODEL'"
  ) &
fi

echo "[entrypoint] Iniciando supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
