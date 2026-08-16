from sqlalchemy import Column, DateTime, Integer, Numeric, String

from app.db.database import Base


class AjusteSaldoManual(Base):
    __tablename__ = "ajustes_saldo_manual"

    id = Column(Integer, primary_key=True, index=True)
    mes_referencia = Column(String, unique=True, index=True, nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), nullable=False)
