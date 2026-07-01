#!/usr/bin/env python3
"""Vérifie Docker PostgreSQL, migrations Alembic et endpoints API."""
from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print(f">>> {' '.join(cmd)}")
    subprocess.check_call(cmd, cwd=cwd or BACKEND)


def http_get(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=5) as resp:
        return json.loads(resp.read().decode())


def wait_for_docker(max_wait: int = 90) -> bool:
    for i in range(max_wait // 3):
        try:
            subprocess.check_call(
                ["docker", "info"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            if i == 0:
                print("En attente de Docker...")
            time.sleep(3)
    return False


def main() -> int:
    skip_api = "--skip-api" in sys.argv

    print("=== 1. Docker PostgreSQL ===")
    if not wait_for_docker():
        print("ERREUR: Docker n'est pas disponible.")
        print("Démarrez Docker Desktop puis relancez: docker compose up -d")
        return 1

    run(["docker", "compose", "up", "-d"], cwd=ROOT)

    print("\n=== 2. Migrations Alembic ===")
    run([sys.executable, "-m", "alembic", "upgrade", "head"])

    print("\n=== 3. Connexion PostgreSQL + seed ===")
    from app.database import SessionLocal
    from app.seed import seed_database

    db = SessionLocal()
    try:
        seed_database(db)
        from app.models import Product, Zone

        zones = db.query(Zone).count()
        products = db.query(Product).count()
        print(f"OK — DB connectée, zones={zones}, products={products}")
    finally:
        db.close()

    print("\n=== 4. API (serveur sur :8001) ===")
    if skip_api:
        print("IGNORE — mode --skip-api")
        print("\n=== DB + migrations OK ===")
        return 0

    try:
        health = http_get("http://localhost:8001/api/v1/health")
        assert health.get("status") == "ok", health
        bootstrap = http_get("http://localhost:8001/api/v1/bootstrap")
        assert len(bootstrap["zones"]) >= 3
        assert len(bootstrap["products"]) >= 35
        print(
            f"OK — API zones={len(bootstrap['zones'])} "
            f"products={len(bootstrap['products'])} profiles={len(bootstrap['profiles'])}"
        )
    except (urllib.error.URLError, AssertionError, KeyError) as exc:
        print(f"API non disponible: {exc}")
        print("Lancez le backend dans un autre terminal: cd backend && python run.py")
        return 1

    print("\n=== Tout est OK ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
