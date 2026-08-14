from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Adiciona colunas novas em tabelas já existentes (create_all não faz isso)."""
    inspector = inspect(engine)
    if "transacoes" not in inspector.get_table_names():
        return

    colunas_existentes = {c["name"] for c in inspector.get_columns("transacoes")}
    colunas_novas = {"usuario_id", "usuario_nome"} - colunas_existentes

    with engine.begin() as conn:
        for coluna in colunas_novas:
            conn.execute(text(f"ALTER TABLE transacoes ADD COLUMN {coluna} VARCHAR"))
