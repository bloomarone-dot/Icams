#!/usr/bin/env bash
# Applique la config nginx hôte pour ICAMS (API + frontend séparés)
# Usage : sudo bash deploy/apply-nginx.sh icams.bloomarone.com
set -euo pipefail

DOMAIN="${1:-}"
API_PORT="${API_PORT:-8002}"
WEB_PORT="${HTTP_PORT:-8080}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Lancez avec sudo"
  exit 1
fi

if [ -z "$DOMAIN" ]; then
  echo "Usage : sudo bash deploy/apply-nginx.sh icams.bloomarone.com"
  exit 1
fi

# Charger HTTP_PORT depuis .env si présent
if [ -f /var/www/icams/.env ]; then
  # shellcheck disable=SC1091
  set -a
  source /var/www/icams/.env
  set +a
  WEB_PORT="${HTTP_PORT:-8080}"
  API_PORT="${API_PORT:-8002}"
fi

SSL_DIR="/etc/letsencrypt/live/${DOMAIN}"
HAS_SSL=false
if [ -f "${SSL_DIR}/fullchain.pem" ] && [ -f "${SSL_DIR}/privkey.pem" ]; then
  HAS_SSL=true
fi

write_locations() {
  cat <<LOC
    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    location /docs {
        proxy_pass http://127.0.0.1:${API_PORT}/docs;
        proxy_set_header Host \$host;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:${API_PORT}/openapi.json;
        proxy_set_header Host \$host;
    }

    location / {
        proxy_pass http://127.0.0.1:${WEB_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
LOC
}

if [ "$HAS_SSL" = true ]; then
  cat > /etc/nginx/sites-available/icams <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate ${SSL_DIR}/fullchain.pem;
    ssl_certificate_key ${SSL_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

$(write_locations)
}
EOF
else
  cat > /etc/nginx/sites-available/icams <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

$(write_locations)
}
EOF
fi

ln -sf /etc/nginx/sites-available/icams /etc/nginx/sites-enabled/icams
nginx -t
systemctl reload nginx

echo "=== Nginx OK ==="
echo "  Frontend → 127.0.0.1:${WEB_PORT}"
echo "  API      → 127.0.0.1:${API_PORT}"
echo ""
echo "Test : curl -s https://${DOMAIN}/api/v1/health"
