from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./vero.db"

    ANTHROPIC_API_KEY: str
    CLAUDE_MODEL: str = "claude-haiku-4-5"

    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_WEBHOOK_SECRET: str
    TELEGRAM_USUARIOS_PERMITIDOS: str  # formato "user_id:Nome,user_id:Nome"

    class Config:
        env_file = ".env"
        extra = "ignore"

    def usuarios_permitidos(self) -> dict[str, str]:
        usuarios = {}
        for par in self.TELEGRAM_USUARIOS_PERMITIDOS.split(","):
            par = par.strip()
            if not par:
                continue
            user_id, _, nome = par.partition(":")
            usuarios[user_id.strip()] = nome.strip()
        return usuarios


settings = Settings()
