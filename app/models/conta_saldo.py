from sqlalchemy import Column, Integer, Numeric, String

from app.db.database import Base


class ContaSaldo(Base):
    __tablename__ = "contas_saldo"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # "vr" | "va"
    saldo_inicial_mes = Column(Numeric(10, 2), nullable=False, default=0)
    saldo_atual = Column(Numeric(10, 2), nullable=False, default=0)
    mes_referencia = Column(String, index=True, nullable=False)  # ex: "2026-08"
