from datetime import date
from typing import Optional


def calcular_mes_referencia(data: date, forma_pagamento: Optional[str], dia_fechamento: Optional[int]) -> str:
    """Mês que a transação impacta no orçamento.

    Compra no crédito feita depois do dia de fechamento da fatura só impacta o mês
    seguinte; nos demais casos (sem fechamento configurado, ou forma de pagamento
    diferente de crédito) o mês é o da própria data da compra.
    """
    if forma_pagamento == "credito" and dia_fechamento is not None and data.day > dia_fechamento:
        ano, mes = data.year, data.month
        if mes == 12:
            return f"{ano + 1}-01"
        return f"{ano}-{mes + 1:02d}"
    return data.strftime("%Y-%m")
