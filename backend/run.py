#!/usr/bin/env python3
"""Applique les migrations Alembic puis lance le serveur."""
import subprocess
import sys


def main() -> None:
    subprocess.check_call([sys.executable, "-m", "alembic", "upgrade", "head"])
    subprocess.check_call([
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8001",
        "--reload",
    ])


if __name__ == "__main__":
    main()
