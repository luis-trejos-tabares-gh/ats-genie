from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    allowed_origin: str = "http://localhost:3000"
    max_upload_bytes: int = 5 * 1024 * 1024
    rate_limit_per_minute: int = 20


settings = Settings()
