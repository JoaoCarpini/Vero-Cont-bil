import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.transacao import Transacao
from app.services.claude_parser import parse_mensagem
from app.services.whatsapp_client import enviar_mensagem

logger = logging.getLogger(__name__)

router = APIRouter()

TZ = ZoneInfo("America/Sao_Paulo")


@router.get("/whatsapp")
def verificar_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge)
    raise HTTPException(status_code=403, detail="Token de verificação inválido")


@router.post("/whatsapp")
async def receber_mensagem(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()

    try:
        change = payload["entry"][0]["changes"][0]["value"]
        mensagens = change.get("messages")
    except (KeyError, IndexError):
        return {"status": "ignorado"}

    if not mensagens:
        return {"status": "ignorado"}

    mensagem = mensagens[0]
    telefone = mensagem["from"]

    if mensagem.get("type") != "text":
        await enviar_mensagem(telefone, "Por enquanto só consigo processar mensagens de texto 🙏")
        return {"status": "tipo_nao_suportado"}

    texto = mensagem["text"]["body"]

    try:
        dados = await parse_mensagem(texto)
    except Exception:
        logger.exception("Falha ao interpretar mensagem via Claude")
        await enviar_mensagem(
            telefone,
            "Não consegui entender essa mensagem. Pode reformular? Ex: 'Gastei 35 reais no mercado, pix'",
        )
        return {"status": "erro_parse"}

    timestamp = int(mensagem.get("timestamp", datetime.now(TZ).timestamp()))
    momento = datetime.fromtimestamp(timestamp, tz=TZ)

    transacao = Transacao(
        tipo=dados["tipo"],
        valor=dados["valor"],
        categoria=dados["categoria"],
        forma_pagamento=dados.get("forma_pagamento"),
        data=momento.date(),
        hora=momento.time(),
        origem="whatsapp",
        texto_original=texto,
        mes_referencia=momento.strftime("%Y-%m"),
    )
    db.add(transacao)
    db.commit()
    db.refresh(transacao)

    sinal = "+" if transacao.tipo == "entrada" else "-"
    confirmacao = (
        f"✅ Registrado!\n"
        f"{sinal} R$ {transacao.valor:.2f}\n"
        f"Categoria: {transacao.categoria}\n"
        + (f"Pagamento: {transacao.forma_pagamento}\n" if transacao.forma_pagamento else "")
    )
    await enviar_mensagem(telefone, confirmacao)

    return {"status": "processado", "transacao_id": transacao.id}
