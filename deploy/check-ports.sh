#!/usr/bin/env bash
# Affiche ce qui utilise les ports web sur le VPS
echo "=== Ports 80 / 443 / 8080 ==="
ss -tlnp | grep -E ':80 |:443 |:8080 ' || echo "(aucun)"

echo ""
echo "=== Conteneurs Docker ==="
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' 2>/dev/null || echo "Docker non actif"

echo ""
echo "=== Sites Nginx activés ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "Nginx non installé"

echo ""
echo "=== IP publique du serveur ==="
curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I

echo ""
echo "=== Test local ICAMS ==="
curl -s -o /dev/null -w "Port 8080 : HTTP %{http_code}\n" http://127.0.0.1:8080/ 2>/dev/null || echo "Port 8080 : inaccessible"
curl -s -o /dev/null -w "Port 80   : HTTP %{http_code}\n" http://127.0.0.1/ 2>/dev/null || echo "Port 80 : inaccessible"
