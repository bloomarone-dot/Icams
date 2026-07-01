#!/usr/bin/env bash
# Déploiement ICAMS sur VPS Hostinger (Ubuntu) — dossier /var/www/icams
set -euo pipefail

INSTALL_DIR="/var/www/icams"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ "$ROOT" != "$INSTALL_DIR" ]; then
  echo "Attention : le déploiement doit se faire depuis ${INSTALL_DIR}"
  echo "Emplacement actuel : ${ROOT}"
  echo "Utilisez : cd ${INSTALL_DIR} && bash deploy/deploy.sh"
  exit 1
fi

cd "$ROOT"

echo "=== ICAMS — déploiement production (${INSTALL_DIR}) ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "Installation de Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Erreur: docker compose plugin requis."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Création du fichier .env depuis deploy/.env.example"
  cp deploy/.env.example .env
  echo ">>> Éditez ${INSTALL_DIR}/.env puis relancez: bash deploy/deploy.sh"
  exit 1
fi

# Détecter conflit port 80
HTTP_PORT_VAL="$(grep -E '^HTTP_PORT=' .env | cut -d= -f2 | tr -d ' \r' || echo 8080)"
if [ "${HTTP_PORT_VAL}" = "80" ] && ss -tlnp 2>/dev/null | grep -q ':80 '; then
  echo ""
  echo ">>> ATTENTION : le port 80 est déjà utilisé sur ce VPS."
  echo ">>> Modifiez .env : HTTP_PORT=8080"
  echo ">>> Puis : bash deploy/setup-host-nginx.sh"
  echo ""
  exit 1
fi

echo ">>> Pull dernières modifications..."
git pull origin main

echo ">>> Build et démarrage des conteneurs..."
docker compose -f docker-compose.prod.yml up -d --build

echo ">>> Statut"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Déploiement terminé ==="
IP="$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo 'VOTRE_IP')"
echo "Application : http://${IP}"
echo "API docs    : http://${IP}/docs"
echo ""
echo ">>> Test API locale : curl -s http://127.0.0.1:${API_PORT:-8002}/api/v1/health"
echo ">>> Si domaine configuré : sudo bash deploy/apply-nginx.sh icams.bloomarone.com"
