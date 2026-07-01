#!/usr/bin/env bash
# Configure Nginx système (port 80) → ICAMS Docker (port 8080)
set -euo pipefail

INSTALL_DIR="/var/www/icams"
CONF_SRC="${INSTALL_DIR}/deploy/nginx/icams-host.conf"
CONF_DST="/etc/nginx/sites-available/icams"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez avec sudo : sudo bash deploy/setup-host-nginx.sh"
  exit 1
fi

if [ ! -f "$CONF_SRC" ]; then
  echo "Fichier introuvable : $CONF_SRC"
  exit 1
fi

# Désactiver le site par défaut s'il occupe le port 80
if [ -L /etc/nginx/sites-enabled/default ]; then
  echo ">>> Désactivation du site nginx default..."
  rm -f /etc/nginx/sites-enabled/default
fi

cp "$CONF_SRC" "$CONF_DST"
ln -sf "$CONF_DST" /etc/nginx/sites-enabled/icams

nginx -t
systemctl reload nginx

echo "=== Nginx configuré ==="
echo "Port 80 (nginx hôte) → http://127.0.0.1:8080 (Docker icams-web)"
echo "Vérifiez que .env contient : HTTP_PORT=8080"
