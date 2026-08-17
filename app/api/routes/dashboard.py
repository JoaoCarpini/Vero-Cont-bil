from datetime import datetime
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.auth import verificar_jwt
from app.db.database import get_db
from app.models.ajuste_saldo import AjusteSaldoManual
from app.models.gasto_recorrente import GastoRecorrente
from app.models.perfil import Perfil
from app.models.transacao import Transacao
from app.services.financeiro import calcular_saldo_projetado

router = APIRouter()

TZ = ZoneInfo("America/Sao_Paulo")


def _serializar_datetime(dt: datetime) -> str:
    # SQLite descarta o tzinfo ao persistir; reanexa o fuso de referência antes
    # de serializar para o timestamp não ser mal interpretado como hora local do cliente.
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ)
    return dt.isoformat()


def _serializar_gasto_recorrente(g: GastoRecorrente) -> dict:
    return {
        "id": g.id,
        "descricao": g.descricao,
        "valor_mensal": float(g.valor_mensal),
        "categoria": g.categoria,
        "parcelas_totais": g.parcelas_totais,
        "parcelas_pagas": g.parcelas_pagas,
        "ativo": g.ativo,
    }


class AtualizarPerfilRequest(BaseModel):
    dia_fechamento_fatura: Optional[int] = Field(default=None, ge=1, le=31)


class AtualizarAjusteSaldoRequest(BaseModel):
    valor: float


class AtualizarParcelasRequest(BaseModel):
    parcelas_pagas: int = Field(ge=0)


class CriarGastoRecorrenteRequest(BaseModel):
    descricao: str = Field(min_length=1)
    valor_mensal: float = Field(gt=0)
    categoria: str = Field(min_length=1)
    parcelas_totais: Optional[int] = Field(default=None, ge=1)
    parcelas_pagas: Optional[int] = Field(default=None, ge=0)


@router.get("/perfil", dependencies=[Depends(verificar_jwt)])
def obter_perfil(db: Session = Depends(get_db)):
    perfil = db.query(Perfil).first()
    if perfil is None:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    return {"dia_fechamento_fatura": perfil.dia_fechamento_fatura}


@router.patch("/perfil", dependencies=[Depends(verificar_jwt)])
def atualizar_perfil(payload: AtualizarPerfilRequest, db: Session = Depends(get_db)):
    perfil = db.query(Perfil).first()
    if perfil is None:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    perfil.dia_fechamento_fatura = payload.dia_fechamento_fatura
    db.commit()
    db.refresh(perfil)

    return {"dia_fechamento_fatura": perfil.dia_fechamento_fatura}


@router.post("/gastos-recorrentes", status_code=201, dependencies=[Depends(verificar_jwt)])
def criar_gasto_recorrente(payload: CriarGastoRecorrenteRequest, db: Session = Depends(get_db)):
    if payload.parcelas_totais is not None:
        if payload.parcelas_pagas is not None and payload.parcelas_pagas > payload.parcelas_totais:
            raise HTTPException(status_code=400, detail="parcelas_pagas não pode passar de parcelas_totais")

    gasto = GastoRecorrente(
        descricao=payload.descricao.strip(),
        valor_mensal=payload.valor_mensal,
        categoria=payload.categoria.strip(),
        parcelas_totais=payload.parcelas_totais,
        parcelas_pagas=(payload.parcelas_pagas or 0) if payload.parcelas_totais is not None else None,
        ativo=True,
    )
    db.add(gasto)
    db.commit()
    db.refresh(gasto)

    return _serializar_gasto_recorrente(gasto)


@router.patch("/gastos-recorrentes/{gasto_id}", dependencies=[Depends(verificar_jwt)])
def atualizar_parcelas_pagas(gasto_id: int, payload: AtualizarParcelasRequest, db: Session = Depends(get_db)):
    gasto = db.query(GastoRecorrente).filter(GastoRecorrente.id == gasto_id).first()
    if gasto is None:
        raise HTTPException(status_code=404, detail="Gasto recorrente não encontrado")
    if gasto.parcelas_totais is None:
        raise HTTPException(status_code=400, detail="Gasto recorrente indefinido não tem parcelas")
    if payload.parcelas_pagas > gasto.parcelas_totais:
        raise HTTPException(status_code=400, detail="parcelas_pagas não pode passar de parcelas_totais")

    gasto.parcelas_pagas = payload.parcelas_pagas
    db.commit()
    db.refresh(gasto)

    return _serializar_gasto_recorrente(gasto)


@router.delete("/gastos-recorrentes/{gasto_id}", dependencies=[Depends(verificar_jwt)])
def desativar_gasto_recorrente(gasto_id: int, db: Session = Depends(get_db)):
    gasto = db.query(GastoRecorrente).filter(GastoRecorrente.id == gasto_id).first()
    if gasto is None:
        raise HTTPException(status_code=404, detail="Gasto recorrente não encontrado")

    gasto.ativo = False
    db.commit()
    db.refresh(gasto)

    return _serializar_gasto_recorrente(gasto)


@router.put("/ajuste-saldo", dependencies=[Depends(verificar_jwt)])
def atualizar_ajuste_saldo(
    payload: AtualizarAjusteSaldoRequest,
    mes: str = Query(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
):
    registro = db.query(AjusteSaldoManual).filter(AjusteSaldoManual.mes_referencia == mes).first()

    # ajuste zero equivale a "sem correção manual" nesse mês, então removemos o registro
    # em vez de guardar um ajuste de valor 0.
    if abs(payload.valor) < 0.005:
        if registro is not None:
            db.delete(registro)
            db.commit()
        return {"mes_referencia": mes, "valor": 0.0, "atualizado_em": None}

    agora = datetime.now(TZ)
    if registro is None:
        registro = AjusteSaldoManual(mes_referencia=mes, valor=payload.valor, atualizado_em=agora)
        db.add(registro)
    else:
        registro.valor = payload.valor
        registro.atualizado_em = agora

    db.commit()
    db.refresh(registro)

    return {
        "mes_referencia": mes,
        "valor": float(registro.valor),
        "atualizado_em": _serializar_datetime(registro.atualizado_em),
    }


@router.delete("/transacoes/{transacao_id}", status_code=204, dependencies=[Depends(verificar_jwt)])
def deletar_transacao(transacao_id: int, db: Session = Depends(get_db)):
    transacao = db.query(Transacao).filter(Transacao.id == transacao_id).first()
    if transacao is None:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    db.delete(transacao)
    db.commit()


@router.get("/dashboard", dependencies=[Depends(verificar_jwt)])
def obter_dashboard(
    mes: Optional[str] = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
):
    mes_atual = datetime.now(TZ).strftime("%Y-%m")
    mes_referencia = mes or mes_atual

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

    ajuste = db.query(AjusteSaldoManual).filter(AjusteSaldoManual.mes_referencia == mes_referencia).first()
    ajuste_valor = float(ajuste.valor) if ajuste else 0.0
    saldo_projetado = float(saldo["saldo_projetado"])

    return {
        "mes_referencia": mes_referencia,
        # mes futuro (ainda nao chegou) => estimativa; mes atual/passado => ja tem
        # movimentacao real lancada, entao o saldo calculado e um resultado, nao projecao.
        "eh_projecao": mes_referencia > mes_atual,
        "saldo": {
            "salario_base": float(saldo["salario_base"]),
            "entradas_lancadas": float(saldo["entradas_lancadas"]),
            "saidas_lancadas": float(saldo["saidas_lancadas"]),
            "gastos_recorrentes": float(saldo["gastos_recorrentes"]),
            "saldo_projetado": saldo_projetado,
            "ajuste_manual": ajuste_valor,
            "saldo_final": saldo_projetado + ajuste_valor,
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
        "gastos_recorrentes": [_serializar_gasto_recorrente(g) for g in gastos_recorrentes],
    }
