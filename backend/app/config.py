from urllib.parse import quote_plus

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str | None = None
    postgres_user: str = "icams"
    postgres_password: str = "icams"
    postgres_host: str = "db"
    postgres_port: int = 5432
    postgres_db: str = "icams"

    cors_origins: list[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
        ]
    )
    api_prefix: str = "/api/v1"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def build_database_url(self) -> "Settings":
        if not self.database_url:
            pwd = quote_plus(self.postgres_password)
            self.database_url = (
                f"postgresql+psycopg://{self.postgres_user}:{pwd}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        return self


settings = Settings()
