# Déploiement ICAMS sur VPS Hostinger

Installation dans **`/var/www/icams`** (standard web Linux).

## Prérequis

- VPS Hostinger avec **Ubuntu 22.04/24.04**
- Accès SSH root ou sudo
- Repo : https://github.com/bloomarone-dot/Icams.git

## 1. Connexion SSH

```bash
ssh root@VOTRE_IP_VPS
```

## 2. Installation (première fois)

```bash
apt update && apt install -y git curl

# Télécharger le script d'installation
curl -fsSL https://raw.githubusercontent.com/bloomarone-dot/Icams/main/deploy/install.sh -o /tmp/icams-install.sh
bash /tmp/icams-install.sh
```

Ou manuellement :

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/bloomarone-dot/Icams.git icams
cd icams

cp deploy/.env.example .env
nano .env
```

Exemple `.env` (`/var/www/icams/.env`) :
```env
POSTGRES_USER=icams
POSTGRES_PASSWORD=MonMotDePasseSecurise123!
POSTGRES_DB=icams
CORS_ORIGINS=http://123.45.67.89
HTTP_PORT=80
```

## 3. Lancer l'application

```bash
cd /var/www/icams
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
```

L'app est sur **http://VOTRE_IP** (port 80).

## 4. Mises à jour

```bash
cd /var/www/icams
bash deploy/deploy.sh
```

## 5. HTTPS (optionnel)

Avec un domaine Hostinger pointant vers le VPS :

```bash
cd /var/www/icams
docker compose -f docker-compose.prod.yml stop web
certbot certonly --standalone -d icams.votredomaine.com
```

## Structure sur le VPS

```
/var/www/icams/
├── backend/
├── frontend/
├── deploy/
├── docker-compose.prod.yml
└── .env
```

## Commandes utiles

```bash
cd /var/www/icams
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml down
```

## Première utilisation

1. `http://VOTRE_IP/desk/setup` — mot de passe admin
2. `http://VOTRE_IP/mobile` — interface terrain
