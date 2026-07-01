#!/usr/bin/env bash
# Configure Nginx système (port 80/443) → ICAMS Docker
set -euo pipefail

INSTALL_DIR="/var/www/icams"
DOMAIN="${1:-icams.bloomarone.com}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez avec sudo : sudo bash deploy/setup-host-nginx.sh [domaine]"
  exit 1
fi

bash "${INSTALL_DIR}/deploy/apply-nginx.sh" "${DOMAIN}"
