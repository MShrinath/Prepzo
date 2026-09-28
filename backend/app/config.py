import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    debug: bool = Field(default=True, alias="DEBUG")

    # Database
    database_url: str = Field(default="sqlite:///./interview_coach.db", alias="DATABASE_URL")

    # LLM Settings
    llm_provider: str = Field(default="mock", alias="LLM_PROVIDER")
    llm_model: str = Field(default="gemini-1.5-flash", alias="LLM_MODEL")
    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_base_url: Optional[str] = Field(default=None, alias="OPENAI_BASE_URL")
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")

    # Voice / STT
    whisper_provider: str = Field(default="mock", alias="WHISPER_PROVIDER")
    whisper_model: str = Field(default="whisper-1", alias="WHISPER_MODEL")

    # CORS & Frontend URL
    frontend_url: Optional[str] = Field(default=None, alias="FRONTEND_URL")
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
        alias="CORS_ORIGINS",
    )

    # Directories
    upload_dir: str = Field(default="./uploads", alias="UPLOAD_DIR")
    data_dir: str = Field(default="./data", alias="DATA_DIR")

    class Config:
        env_file = [str(Path(__file__).resolve().parents[2] / ".env"), ".env"]
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def clean_openai_base_url(self) -> Optional[str]:
        return self.openai_base_url.strip() if self.openai_base_url else None

    @property
    def cors_origin_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if self.frontend_url and self.frontend_url.strip() not in origins:
            origins.append(self.frontend_url.strip())
        return origins


settings = Settings()
