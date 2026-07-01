#!/usr/bin/env bash
# Déploiement ICAMS sur VPS Hostinger (Ubuntu)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== ICAMS — déploiement production ==="

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
  echo ">>> Éditez .env (mot de passe DB, CORS_ORIGINS) puis relancez: bash deploy/deploy.sh"
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
echo "Application : http://$(curl -s ifconfig.me 2>/dev/null || echo 'VOTRE_IP')"
echo "API docs    : http://$(curl -s ifconfig.me 2>/dev/null || echo 'VOTRE_IP')/docs"
