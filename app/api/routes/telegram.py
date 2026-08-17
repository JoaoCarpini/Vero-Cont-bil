import logging
import secrets
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.perfil import Perfil
from app.models.transacao import Transacao
from app.services.claude_parser import parse_mensagem
from app.services.mes_referencia import calcular_mes_referencia
from app.services.telegram_client import enviar_mensagem

logger = logging.getLogger(__name__)

router = APIRouter()

TZ = ZoneInfo("America/Sao_Paulo")


@router.post("/telegram")
async def receber_mensagem(
    request: Request,
    db: Session = Depends(get_db),
    x_telegram_bot_api_secret_token: str = Header(default=""),
):
    if not secrets.compare_digest(x_telegram_bot_api_secret_token, settings.TELEGRAM_WEBHOOK_SECRET):
        raise HTTPException(status_code=403, detail="Secret token inválido")

    update = await request.json()
    print("Update recebido:", update)

    mensagem = update.get("message")
    if not mensagem:
        return {"status": "ignorado"}

    chat_id = mensagem["chat"]["id"]
    user_id = str(mensagem["from"]["id"])

    usuarios = settings.usuarios_permitidos()
    usuario_nome = usuarios.get(user_id)
    if usuario_nome is None:
        await enviar_mensagem(chat_id, "🚫 Você não tem acesso a este bot.")
        return {"status": "acesso_negado"}

    texto = mensagem.get("text")
    if not texto:
        await enviar_mensagem(chat_id, "Por enquanto só consigo processar mensagens de texto 🙏")
        return {"status": "tipo_nao_suportado"}

    try:
        dados = await parse_mensagem(texto)
    except Exception:
        logger.exception("Falha ao interpretar mensagem via Claude")
        await enviar_mensagem(
            chat_id,
            "Não consegui entender essa mensagem. Pode reformular? Ex: 'Gastei 35 reais no mercado, pix'",
        )
        return {"status": "erro_parse"}

    timestamp = int(mensagem.get("date", datetime.now(TZ).timestamp()))
    momento = datetime.fromtimestamp(timestamp, tz=TZ)

    perfil = db.query(Perfil).first()
    dia_fechamento = perfil.dia_fechamento_fatura if perfil else None

    transacao = Transacao(
        tipo=dados["tipo"],
        valor=dados["valor"],
        categoria=dados["categoria"],
        forma_pagamento=dados.get("forma_pagamento"),
        data=momento.date(),
        hora=momento.time(),
        origem="telegram",
        texto_original=texto,
        mes_referencia=calcular_mes_referencia(momento.date(), dados.get("forma_pagamento"), dia_fechamento),
        usuario_id=user_id,
        usuario_nome=usuario_nome,
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
    await enviar_mensagem(chat_id, confirmacao)

    return {"status": "processado", "transacao_id": transacao.id}
