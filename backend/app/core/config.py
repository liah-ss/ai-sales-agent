from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    app_name: str = "Website API"
    api_prefix: str = "/api"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
            ]
    database_url: str
    database_pool_size: int = 6
    database_max_overflow: int = 2
    database_pool_timeout_seconds: int = 10
    database_pool_recycle_seconds: int = 1800
    database_auto_create_schema: bool = False
    # database remains available for controlled indexing and management APIs.
    # Keep full-row MySQL pages small because public JSON fields can be large.
    # The incremental worker is independent from API workers and only polls
    cos_upload_enabled: bool = False
    cos_bucket: str = ""
    cos_region: str = ""
    cos_secret_id: str = ""
    cos_secret_key: str = ""
    cos_public_base_url: str = ""
    auth_secret_key: str = "dev-change-me"
    access_token_expire_minutes: int = 480
    admin_default_username: str = "admin"
    admin_default_password: str = "ChangeMe123!"
    speech_transcription_api_key: str = ""
    speech_transcription_base_url: str = "https://api.openai.com/v1"
    speech_transcription_model: str = "whisper-1"
    speech_transcription_max_bytes: int = 10 * 1024 * 1024
    dashscope_api_key: str = ""
    dashscope_websocket_url: str = "wss://dashscope.aliyuncs.com/api-ws/v1/inference"
    realtime_asr_model: str = "fun-asr-realtime"
    translation_provider: str = "openai-compatible"
    translation_api_key: str = ""
    translation_base_url: str = "https://api.openai.com/v1"
    translation_model: str = "gpt-4.1-mini"
    translation_timeout_seconds: int = 90
    redis_url: str = ""
    redis_cache_ttl_seconds: int = 86400
    redis_cache_namespace: str = "examplecorp"
    public_site_url: str = "https://example.com"
    nuxt_revalidate_url: str = ""
    nuxt_revalidate_urls: str = ""
    nuxt_revalidate_secret: str = ""
    crm_inquiry_webhook_url: str = ""
    crm_inquiry_webhook_token: str = ""
    crm_inquiry_timeout_seconds: int = 10
    crm_inquiry_retry_attempts: int = 3
    crm_inquiry_retry_delay_seconds: float = 1.0
    analytics_timezone: str = "Asia/Shanghai"
    # Keep interactive retrieval independent from batch indexing defaults.
    # Bump this deliberately when a prompt, policy, retrieval strategy, or
    # response contract changes in a way that makes prior answers unsafe.
    # Used only to encrypt runtime API keys before they are stored in SQL.
    # Keep this value in the server environment, never in the repository.

    # Resolve dotenv files from the repository so the same configuration works
    # when Uvicorn starts from the repository root or from backend/.
    model_config = SettingsConfigDict(
        env_file=(
            str(PROJECT_ROOT / ".env"),
            str(PROJECT_ROOT / "backend" / ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
