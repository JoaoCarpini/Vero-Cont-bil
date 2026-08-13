import httpx

from app.core.config import settings

GRAPH_API_VERSION = "v21.0"


async def enviar_mensagem(telefone: str, texto: str) -> None:
    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"}
    payload = {
        "messaging_product": "whatsapp",
        "to": telefone,
        "type": "text",
        "text": {"body": texto},
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
