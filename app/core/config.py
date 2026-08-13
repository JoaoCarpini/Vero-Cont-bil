from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./vero.db"

    ANTHROPIC_API_KEY: str
    CLAUDE_MODEL: str = "claude-haiku-4-5"

    WHATSAPP_PHONE_NUMBER_ID: str
    WHATSAPP_WABA_ID: str
    WHATSAPP_ACCESS_TOKEN: str
    WHATSAPP_VERIFY_TOKEN: str

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
