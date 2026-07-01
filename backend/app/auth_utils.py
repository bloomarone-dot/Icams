import hashlib


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    return hash_password(password) == password_hash


def has_password(password_hash: str | None) -> bool:
    return bool(password_hash)
