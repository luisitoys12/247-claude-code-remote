#!/bin/sh
set -e

mkdir -p /root/.247/data
mkdir -p /root/projects
mkdir -p /root/.ollama/models
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
fi

# ── Info de providers disponibles ──
echo "[entrypoint] Ollama: interno en http://127.0.0.1:11434"
[ -n "$OPENROUTER_API_KEY" ] \
  && echo "[entrypoint] OpenRouter: OK" \
  || echo "[entrypoint] OpenRouter: no configurado (opcional)"

# ── Pull automático de modelo si se especifica DEFAULT_OLLAMA_MODEL ──
# Ejemplo: fly secrets set DEFAULT_OLLAMA_MODEL=qwen2.5-coder:7b
# El pull ocurre en background para no bloquear el arranque
if [ -n "$DEFAULT_OLLAMA_MODEL" ]; then
  echo "[entrypoint] Se descargará el modelo '$DEFAULT_OLLAMA_MODEL' tras arrancar Ollama..."
  (
    sleep 15  # esperar a que ollama serve esté listo
    ollama pull "$DEFAULT_OLLAMA_MODEL" && \
      echo "[entrypoint] Modelo '$DEFAULT_OLLAMA_MODEL' listo" || \
      echo "[entrypoint] WARN: falló el pull de '$DEFAULT_OLLAMA_MODEL'"
  ) &
fi

echo "[entrypoint] Iniciando supervisord (ollama + agent + web + nginx)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
