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
HTTP_PORT=8080
```

> **Port 80 déjà pris ?** Hostinger a souvent nginx/apache sur le port 80.
> Mettez `HTTP_PORT=8080` puis : `sudo bash deploy/setup-host-nginx.sh`

## 3. Lancer l'application

```bash
cd /var/www/icams
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
```

L'app est sur **http://VOTRE_IP** (port 80 via nginx hôte, ou `:8080` si nginx non configuré).

### Si erreur « port 80 already in use »

```bash
cd /var/www/icams
nano .env                    # HTTP_PORT=8080
bash deploy/deploy.sh
sudo bash deploy/setup-host-nginx.sh
```

## 4. Mises à jour

```bash
cd /var/www/icams
bash deploy/deploy.sh
```

## 5. Nom de domaine

### Étape A — DNS (hPanel Hostinger)

1. hPanel → **Domaines** → votre domaine → **DNS / Zone DNS**
2. Ajoutez un enregistrement **A** :
   - **Nom** : `icams` (ou `@` pour la racine)
   - **Pointe vers** : IP de votre VPS
   - TTL : 3600

Résultat : `icams.votredomaine.com` → IP du VPS

Vérification (depuis le VPS ou votre PC) :
```bash
dig +short icams.votredomaine.com
# doit afficher l'IP du VPS
```

### Étape B — Configurer ICAMS

```bash
cd /var/www/icams
git pull origin main
chmod +x deploy/setup-domain.sh
sudo bash deploy/setup-domain.sh icams.votredomaine.com
```

### Vérifier ce qui utilise l'IP / les ports

```bash
cd /var/www/icams
bash deploy/check-ports.sh
```

> **Important** : une même IP peut héberger **plusieurs sites** via nginx.
> Chaque domaine a son `server_name` — ils ne se bloquent pas entre eux.
> Seul le **port 80/443** doit être géré par **un seul** nginx (déjà le cas chez vous).

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
