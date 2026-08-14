from sqlalchemy import Column, Date, Integer, Numeric, String, Text, Time

from app.db.database import Base


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # "entrada" | "saida"
    valor = Column(Numeric(10, 2), nullable=False)
    categoria = Column(String, nullable=False)
    forma_pagamento = Column(String, nullable=True)  # "credito" | "debito" | "pix" | "dinheiro" | "vr" | "va" | None
    data = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    origem = Column(String, nullable=False)  # "telegram" | "dashboard" | "historico"
    texto_original = Column(Text, nullable=True)
    mes_referencia = Column(String, index=True, nullable=False)  # ex: "2026-08"
    usuario_id = Column(String, nullable=True)  # Telegram user_id de quem lançou
    usuario_nome = Column(String, nullable=True)
