from sqlalchemy import Boolean, Column, Integer, Numeric, String

from app.db.database import Base


class GastoRecorrente(Base):
    __tablename__ = "gastos_recorrentes"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String, nullable=False)
    valor_mensal = Column(Numeric(10, 2), nullable=False)
    categoria = Column(String, nullable=False)
    parcelas_totais = Column(Integer, nullable=True)  # null = recorrência indefinida (ex: assinatura)
    parcelas_pagas = Column(Integer, nullable=True)
    ativo = Column(Boolean, nullable=False, default=True)
