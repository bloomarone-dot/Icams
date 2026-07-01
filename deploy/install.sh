#!/usr/bin/env bash
# Installation initiale ICAMS dans /var/www/icams
set -euo pipefail

INSTALL_DIR="/var/www/icams"
REPO="https://github.com/bloomarone-dot/Icams.git"

echo "=== ICAMS — installation dans ${INSTALL_DIR} ==="

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez en root ou avec sudo : sudo bash deploy/install.sh"
  exit 1
fi

apt-get update
apt-get install -y git curl

mkdir -p /var/www

if [ -d "${INSTALL_DIR}/.git" ]; then
  echo ">>> Dépôt déjà présent, mise à jour..."
  cd "${INSTALL_DIR}"
  git pull origin main
else
  echo ">>> Clonage du dépôt..."
  git clone "${REPO}" "${INSTALL_DIR}"
  cd "${INSTALL_DIR}"
fi

if [ ! -f .env ]; then
  cp deploy/.env.example .env
  echo ""
  echo ">>> Fichier .env créé. Éditez-le :"
  echo "    nano ${INSTALL_DIR}/.env"
  echo ""
  echo "    POSTGRES_PASSWORD=..."
  echo "    CORS_ORIGINS=http://VOTRE_IP"
  echo ""
  echo "Puis lancez : bash ${INSTALL_DIR}/deploy/deploy.sh"
  exit 0
fi

bash deploy/deploy.sh
