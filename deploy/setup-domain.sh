#!/usr/bin/env bash
# Configure un nom de domaine pour ICAMS (nginx + CORS + HTTPS optionnel)
# Usage : sudo bash deploy/setup-domain.sh icams.votredomaine.com
set -euo pipefail

INSTALL_DIR="/var/www/icams"
DOMAIN="${1:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez avec sudo : sudo bash deploy/setup-domain.sh icams.votredomaine.com"
  exit 1
fi

if [ -z "$DOMAIN" ]; then
  echo "Usage : sudo bash deploy/setup-domain.sh icams.votredomaine.com"
  exit 1
fi

cd "$INSTALL_DIR"

echo "=== Configuration domaine : ${DOMAIN} ==="

# Mettre à jour CORS dans .env
if grep -q '^CORS_ORIGINS=' .env; then
  sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=https://${DOMAIN},http://${DOMAIN}|" .env
else
  echo "CORS_ORIGINS=https://${DOMAIN},http://${DOMAIN}" >> .env
fi

# Nginx avec server_name
cat > /etc/nginx/sites-available/icams <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/icams /etc/nginx/sites-enabled/icams
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t
systemctl reload nginx

docker compose -f docker-compose.prod.yml restart api

echo ""
echo ">>> DNS : vérifiez que ${DOMAIN} pointe vers ce serveur"
echo "    dig +short ${DOMAIN}"
echo ""
echo ">>> Test HTTP : curl -I http://${DOMAIN}"
echo ""
read -r -p "Installer HTTPS avec Let's Encrypt ? (o/n) " REPLY
if [[ "$REPLY" =~ ^[oOyY] ]]; then
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "admin@${DOMAIN}" || certbot --nginx -d "${DOMAIN}"
  sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=https://${DOMAIN}|" .env
  docker compose -f docker-compose.prod.yml restart api
  echo "HTTPS activé : https://${DOMAIN}"
else
  echo "Site disponible : http://${DOMAIN}"
fi

echo "=== Terminé ==="
