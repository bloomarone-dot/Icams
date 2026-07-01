# Déploiement ICAMS sur VPS Hostinger

## Prérequis

- VPS Hostinger avec **Ubuntu 22.04/24.04**
- Accès SSH (root ou sudo)
- Repo GitHub : https://github.com/bloomarone-dot/Icams.git

## 1. Connexion SSH

```bash
ssh root@VOTRE_IP_VPS
```

(Récupérez l'IP dans hPanel → VPS → Aperçu)

## 2. Installation (première fois)

```bash
apt update && apt install -y git curl

cd /opt
git clone https://github.com/bloomarone-dot/Icams.git
cd Icams

cp deploy/.env.example .env
nano .env   # modifiez POSTGRES_PASSWORD et CORS_ORIGINS
```

Exemple `.env` :
```env
POSTGRES_USER=icams
POSTGRES_PASSWORD=MonMotDePasseSecurise123!
POSTGRES_DB=icams
CORS_ORIGINS=http://123.45.67.89
HTTP_PORT=80
```

## 3. Lancer l'application

```bash
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
```

L'app est accessible sur **http://VOTRE_IP** (port 80).

## 4. Mises à jour

```bash
cd /opt/Icams
bash deploy/deploy.sh
```

## 5. HTTPS (optionnel — domaine Hostinger)

Si vous avez un domaine pointant vers le VPS :

```bash
apt install -y certbot
# Arrêtez temporairement le port 80 si certbot standalone :
docker compose -f docker-compose.prod.yml stop web
certbot certonly --standalone -d icams.votredomaine.com
```

Puis configurez un reverse proxy ou montez les certificats (contactez le support ou utilisez nginx sur l'hôte).

## Architecture production

```
Internet :80
    └── web (nginx) → fichiers React + proxy /api
            └── api (FastAPI :8000)
                    └── db (PostgreSQL)
```

## Commandes utiles

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml down
```

## Première utilisation

1. Ouvrir `http://VOTRE_IP/desk/setup` — définir le mot de passe admin
2. Interface terrain : `http://VOTRE_IP/mobile`
