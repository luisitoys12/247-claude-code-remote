#!/bin/sh
# Crea config.json si no existe (el volumen puede sobreescribir /root/.247/)
CONFIG_FILE="/root/.247/config.json"

mkdir -p /root/.247/data

if [ ! -f "$CONFIG_FILE" ]; then
  echo "[entrypoint] Config no encontrado, creando default..."
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
  echo "[entrypoint] Config creado en $CONFIG_FILE"
else
  echo "[entrypoint] Config existente encontrado en $CONFIG_FILE"
fi

exec node dist/index.js
