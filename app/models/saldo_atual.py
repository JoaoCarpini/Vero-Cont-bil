from sqlalchemy import Column, DateTime, Integer, Numeric

from app.db.database import Base


class SaldoAtual(Base):
    __tablename__ = "saldo_atual"

    id = Column(Integer, primary_key=True, index=True)
    valor = Column(Numeric(10, 2), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), nullable=False)
