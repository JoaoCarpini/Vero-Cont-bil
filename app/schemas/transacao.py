from typing import Literal, Optional

from pydantic import BaseModel, Field

FormaPagamento = Literal["credito", "debito", "pix", "dinheiro", "vr", "va"]


class TransacaoParseada(BaseModel):
    tipo: Literal["entrada", "saida"]
    valor: float = Field(gt=0)
    categoria: str
    forma_pagamento: Optional[FormaPagamento] = None
