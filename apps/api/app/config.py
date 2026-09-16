from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    allowed_origin: str = "http://localhost:3000"
    max_upload_bytes: int = 3 * 1024 * 1024
    rate_limit_per_minute: int = 5
    session_limit: int = 3
    session_window_seconds: int = 3600
    global_min_interval: int = 20
    global_daily_limit: int = 30
    rate_limit_salt: str = "ats-assistant-dev-salt"
    prompt_char_limit: int = 6000
    groq_timeout_seconds: float = 45


settings = Settings()
