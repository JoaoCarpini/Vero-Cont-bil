import calendar
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.gasto_recorrente import GastoRecorrente
from app.models.perfil import Perfil
from app.models.transacao import Transacao


def salario_do_mes(perfil: Perfil, ano: int, mes: int) -> Decimal:
    """Escolhe o valor de salário conforme a quantidade de dias do mês.

    Meses com menos de 31 dias (incluindo fevereiro) caem no valor de 30 dias,
    já que não há um valor específico informado para eles.
    """
    dias_no_mes = calendar.monthrange(ano, mes)[1]
    if dias_no_mes >= 31 and perfil.salario_base_31_dias is not None:
        return perfil.salario_base_31_dias
    return perfil.salario_base_30_dias or Decimal("0")


def total_gastos_recorrentes(db: Session) -> Decimal:
    """Soma os gastos recorrentes ativos que ainda não terminaram as parcelas."""
    gastos = db.query(GastoRecorrente).filter(GastoRecorrente.ativo.is_(True)).all()

    total = Decimal("0")
    for gasto in gastos:
        if gasto.parcelas_totais is not None and (gasto.parcelas_pagas or 0) >= gasto.parcelas_totais:
            continue
        total += gasto.valor_mensal
    return total


def calcular_saldo_projetado(db: Session, mes_referencia: str) -> dict:
    """Projeção do saldo do mês: salário + entradas lançadas - saídas lançadas - gastos recorrentes."""
    ano, mes = (int(parte) for parte in mes_referencia.split("-"))

    perfil = db.query(Perfil).first()
    salario = salario_do_mes(perfil, ano, mes) if perfil else Decimal("0")

    entradas = db.query(func.coalesce(func.sum(Transacao.valor), 0)).filter(
        Transacao.mes_referencia == mes_referencia, Transacao.tipo == "entrada"
    ).scalar()
    saidas = db.query(func.coalesce(func.sum(Transacao.valor), 0)).filter(
        Transacao.mes_referencia == mes_referencia, Transacao.tipo == "saida"
    ).scalar()

    recorrentes = total_gastos_recorrentes(db)

    saldo = Decimal(salario) + Decimal(entradas) - Decimal(saidas) - recorrentes

    return {
        "mes_referencia": mes_referencia,
        "salario_base": salario,
        "entradas_lancadas": Decimal(entradas),
        "saidas_lancadas": Decimal(saidas),
        "gastos_recorrentes": recorrentes,
        "saldo_projetado": saldo,
    }
