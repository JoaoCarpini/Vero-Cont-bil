import csv
import io
import secrets
from datetime import datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.perfil import Perfil
from app.models.transacao import Transacao
from app.services.mes_referencia import calcular_mes_referencia

router = APIRouter()

TIPOS_VALIDOS = {"entrada", "saida"}
FORMAS_PAGAMENTO_VALIDAS = {"credito", "debito", "pix", "dinheiro", "vr", "va"}
COLUNAS_OBRIGATORIAS = {"data", "tipo", "valor", "categoria", "forma_pagamento"}


def _validar_linha(linha: dict, dia_fechamento: Optional[int]) -> tuple[Optional[Transacao], Optional[str]]:
    data_bruta = (linha.get("data") or "").strip()
    tipo = (linha.get("tipo") or "").strip().lower()
    valor_bruto = (linha.get("valor") or "").strip()
    categoria = (linha.get("categoria") or "").strip()
    forma_pagamento = (linha.get("forma_pagamento") or "").strip().lower()
    descricao = (linha.get("descricao") or "").strip() or None

    try:
        data = datetime.strptime(data_bruta, "%Y-%m-%d").date()
    except ValueError:
        return None, f"data inválida: '{data_bruta}' (esperado AAAA-MM-DD)"

    if tipo not in TIPOS_VALIDOS:
        return None, f"tipo inválido: '{tipo}' (esperado entrada ou saida)"

    try:
        valor = float(valor_bruto)
    except ValueError:
        return None, f"valor inválido: '{valor_bruto}'"
    if valor <= 0:
        return None, f"valor deve ser maior que zero: '{valor_bruto}'"

    if not categoria:
        return None, "categoria obrigatória"

    if forma_pagamento and forma_pagamento not in FORMAS_PAGAMENTO_VALIDAS:
        return None, f"forma_pagamento inválida: '{forma_pagamento}'"

    transacao = Transacao(
        tipo=tipo,
        valor=valor,
        categoria=categoria,
        forma_pagamento=forma_pagamento or None,
        data=data,
        hora=time(0, 0),
        origem="historico",
        texto_original=descricao,
        mes_referencia=calcular_mes_referencia(data, forma_pagamento or None, dia_fechamento),
    )
    return transacao, None


@router.post("/csv")
async def importar_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    x_api_key: str = Header(default=""),
):
    if not secrets.compare_digest(x_api_key, settings.IMPORT_API_KEY):
        raise HTTPException(status_code=403, detail="API key inválida")

    conteudo = await file.read()
    try:
        texto = conteudo.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Arquivo precisa estar em UTF-8")

    leitor = csv.DictReader(io.StringIO(texto))
    if leitor.fieldnames is None or not COLUNAS_OBRIGATORIAS.issubset(set(leitor.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV precisa ter as colunas: {', '.join(sorted(COLUNAS_OBRIGATORIAS))}",
        )

    perfil = db.query(Perfil).first()
    dia_fechamento = perfil.dia_fechamento_fatura if perfil else None

    erros = []
    importadas = 0

    for numero, linha in enumerate(leitor, start=2):  # linha 1 é o cabeçalho
        transacao, motivo = _validar_linha(linha, dia_fechamento)
        if motivo:
            erros.append({"linha": numero, "motivo": motivo})
            continue

        try:
            db.add(transacao)
            db.commit()
            importadas += 1
        except Exception as exc:
            db.rollback()
            erros.append({"linha": numero, "motivo": f"erro ao salvar: {exc}"})

    return {
        "total_linhas": importadas + len(erros),
        "importadas": importadas,
        "falhas": len(erros),
        "erros": erros,
    }
