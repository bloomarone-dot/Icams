from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

if settings.database_url.startswith("sqlite"):
    connect_args: dict = {"check_same_thread": False}
    engine_kwargs: dict = {}
else:
    connect_args = {"connect_timeout": 10}
    engine_kwargs = {"pool_pre_ping": True, "pool_size": 5, "max_overflow": 10}

engine = create_engine(settings.database_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
