from sqlalchemy import Column, Integer, Numeric

from app.db.database import Base


class Perfil(Base):
    __tablename__ = "perfil"

    id = Column(Integer, primary_key=True, index=True)
    salario_base_30_dias = Column(Numeric(10, 2), nullable=True)
    salario_base_31_dias = Column(Numeric(10, 2), nullable=True)
    dia_recebimento = Column(Integer, nullable=True)  # dia do mês, 1-31
