from decimal import Decimal

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

    if "perfil" in inspector.get_table_names():
        colunas_existentes = {c["name"] for c in inspector.get_columns("perfil")}
        tipos_coluna = {
            "salario_base_30_dias": "NUMERIC(10, 2)",
            "salario_base_31_dias": "NUMERIC(10, 2)",
            "dia_fechamento_fatura": "INTEGER",
        }
        colunas_novas = set(tipos_coluna) - colunas_existentes

        with engine.begin() as conn:
            for coluna in colunas_novas:
                conn.execute(text(f"ALTER TABLE perfil ADD COLUMN {coluna} {tipos_coluna[coluna]}"))


def seed_dados_iniciais() -> None:
    """Popula perfil e gastos recorrentes com os valores iniciais, se ainda não existirem."""
    from app.models.gasto_recorrente import GastoRecorrente
    from app.models.perfil import Perfil

    db = SessionLocal()
    try:
        if db.query(Perfil).count() == 0:
            db.add(
                Perfil(
                    salario_base_30_dias=Decimal("1016.07"),
                    salario_base_31_dias=Decimal("1056.97"),
                    dia_fechamento_fatura=25,
                )
            )

        if db.query(GastoRecorrente).count() == 0:
            db.add_all(
                [
                    GastoRecorrente(
                        descricao="Memória RAM",
                        valor_mensal=Decimal("83.67"),
                        categoria="Compras",
                        parcelas_totais=10,
                        parcelas_pagas=7,
                        ativo=True,
                    ),
                    GastoRecorrente(
                        descricao="Assinatura Claude",
                        valor_mensal=Decimal("55.00"),
                        categoria="Assinaturas",
                        parcelas_totais=None,
                        parcelas_pagas=None,
                        ativo=True,
                    ),
                    GastoRecorrente(
                        descricao="Faculdade",
                        valor_mensal=Decimal("527.64"),
                        categoria="Educação",
                        parcelas_totais=29,  # de agosto/2026 até dezembro/2028
                        parcelas_pagas=0,
                        ativo=True,
                    ),
                ]
            )

        db.commit()
    finally:
        db.close()
