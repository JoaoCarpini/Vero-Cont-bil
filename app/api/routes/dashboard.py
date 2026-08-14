import secrets
from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.gasto_recorrente import GastoRecorrente
from app.models.saldo_atual import SaldoAtual
from app.models.transacao import Transacao
from app.services.financeiro import calcular_saldo_projetado

router = APIRouter()

TZ = ZoneInfo("America/Sao_Paulo")


def verificar_api_key(x_api_key: str = Header(default="")) -> None:
    if not secrets.compare_digest(x_api_key, settings.DASHBOARD_API_KEY):
        raise HTTPException(status_code=403, detail="API key inválida")


def _serializar_datetime(dt: datetime) -> str:
    # SQLite descarta o tzinfo ao persistir; reanexa o fuso de referência antes
    # de serializar para o timestamp não ser mal interpretado como hora local do cliente.
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ)
    return dt.isoformat()


class AtualizarSaldoAtualRequest(BaseModel):
    valor: float


@router.put("/saldo-atual", dependencies=[Depends(verificar_api_key)])
def atualizar_saldo_atual(payload: AtualizarSaldoAtualRequest, db: Session = Depends(get_db)):
    registro = db.query(SaldoAtual).first()
    agora = datetime.now(TZ)

    if registro is None:
        registro = SaldoAtual(valor=payload.valor, atualizado_em=agora)
        db.add(registro)
    else:
        registro.valor = payload.valor
        registro.atualizado_em = agora

    db.commit()
    db.refresh(registro)

    return {"valor": float(registro.valor), "atualizado_em": _serializar_datetime(registro.atualizado_em)}


@router.get("/dashboard", dependencies=[Depends(verificar_api_key)])
def obter_dashboard(
    mes: Optional[str] = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
):
    mes_referencia = mes or datetime.now(TZ).strftime("%Y-%m")

    saldo = calcular_saldo_projetado(db, mes_referencia)

    transacoes = (
        db.query(Transacao)
        .filter(Transacao.mes_referencia == mes_referencia)
        .order_by(Transacao.data.desc(), Transacao.hora.desc())
        .all()
    )

    por_categoria = (
        db.query(Transacao.categoria, func.sum(Transacao.valor))
        .filter(Transacao.mes_referencia == mes_referencia, Transacao.tipo == "saida")
        .group_by(Transacao.categoria)
        .order_by(func.sum(Transacao.valor).desc())
        .all()
    )

    por_forma_pagamento = (
        db.query(Transacao.forma_pagamento, func.sum(Transacao.valor))
        .filter(Transacao.mes_referencia == mes_referencia, Transacao.tipo == "saida")
        .group_by(Transacao.forma_pagamento)
        .order_by(func.sum(Transacao.valor).desc())
        .all()
    )

    gastos_recorrentes = db.query(GastoRecorrente).order_by(GastoRecorrente.id).all()
    saldo_atual = db.query(SaldoAtual).first()

    return {
        "mes_referencia": mes_referencia,
        "saldo_atual": (
            {"valor": float(saldo_atual.valor), "atualizado_em": _serializar_datetime(saldo_atual.atualizado_em)}
            if saldo_atual
            else None
        ),
        "saldo": {
            "salario_base": float(saldo["salario_base"]),
            "entradas_lancadas": float(saldo["entradas_lancadas"]),
            "saidas_lancadas": float(saldo["saidas_lancadas"]),
            "gastos_recorrentes": float(saldo["gastos_recorrentes"]),
            "saldo_projetado": float(saldo["saldo_projetado"]),
        },
        "transacoes": [
            {
                "id": t.id,
                "tipo": t.tipo,
                "valor": float(t.valor),
                "categoria": t.categoria,
                "forma_pagamento": t.forma_pagamento,
                "data": t.data.isoformat(),
                "hora": t.hora.isoformat(),
                "descricao": t.texto_original,
                "origem": t.origem,
            }
            for t in transacoes
        ],
        "distribuicao_categoria": [
            {"categoria": categoria, "total": float(total)} for categoria, total in por_categoria
        ],
        "distribuicao_forma_pagamento": [
            {"forma_pagamento": forma or "não informado", "total": float(total)}
            for forma, total in por_forma_pagamento
        ],
        "gastos_recorrentes": [
            {
                "id": g.id,
                "descricao": g.descricao,
                "valor_mensal": float(g.valor_mensal),
                "categoria": g.categoria,
                "parcelas_totais": g.parcelas_totais,
                "parcelas_pagas": g.parcelas_pagas,
                "ativo": g.ativo,
            }
            for g in gastos_recorrentes
        ],
    }
