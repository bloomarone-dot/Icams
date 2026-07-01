def can_access_desk(role: str) -> bool:
    return role in ("ADMIN", "DIRECTION")
