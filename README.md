# ICAMS — Inventory Control & Audit Management System

Application ATG en deux interfaces :

- **Terrain (mobile)** : `/mobile` — inventaire pour les contrôleurs
- **Bureau (desktop)** : `/desk` — direction, import Odoo, validation, paramètres

## Architecture

```
icams/
├── docker-compose.yml   PostgreSQL (Docker)
├── frontend/            React + TypeScript + Vite
└── backend/             Python FastAPI + Alembic
```

Le frontend communique avec le backend via `/api/v1`. En mode hors ligne, les données restent disponibles via le cache IndexedDB local.

## Démarrage

### 1. Base de données (Docker)

```bash
docker compose up -d
```

PostgreSQL écoute sur `localhost:5434` (user/mot de passe/base : `icams`). Le port est configurable dans `docker-compose.yml`.

### 2. Backend (Python)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux / macOS
pip install -r requirements.txt
copy .env.example .env        # Windows — déjà configuré pour Docker
# cp .env.example .env        # Linux / macOS
alembic upgrade head          # applique les migrations
python run.py                 # migrations + serveur API
```

API : http://localhost:8001 — documentation : http://localhost:8001/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Migrations (Alembic)

```bash
cd backend
alembic upgrade head              # appliquer
alembic revision --autogenerate -m "description"   # nouvelle migration
alembic downgrade -1              # annuler la dernière
```

## Parcours terrain

1. Choisir le profil contrôleur
2. Nouvelle mission : Zone → Site → Magasin → Entité (AFKOT/BOSCAM/CTC) → Famille
3. Saisir chaque produit (cigarettes : nouvelle/ancienne image ; gadgets ; vapes)
4. Soumettre à la direction

## Bureau

- **Import Odoo** : CSV/XLSX du stock système par magasin
- **Missions** : réconciliation, validation, export CSV vers Odoo
- **Admin** : produits, magasins, profils, cadences
- **Paramètres** : règles de conversion, mapping colonnes Odoo, observations

## Stack

**Frontend** : React 19, TypeScript, Vite, Tailwind CSS 4, Dexie (cache offline)

**Backend** : Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL (Docker), Pydantic
