from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal
from app.routers import api
from app.seed import seed_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="ICAMS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {"service": "ICAMS API", "docs": "/docs", "health": f"{settings.api_prefix}/health"}
