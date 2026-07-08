from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./sis.db"
    jwt_secret_key: str = "change-me"
    jwt_expiration_minutes: int = 60
    cors_origins: list[str] = ["http://localhost:5173"]  # port par défaut de Vite

    class Config:
        env_file = ".env"

settings = Settings()