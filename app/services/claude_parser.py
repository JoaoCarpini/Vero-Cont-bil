import json
import re

from anthropic import AsyncAnthropic

from app.core.config import settings

_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

CATEGORIAS_SUGERIDAS = [
    "Salário", "Alimentação", "Transporte", "Moradia", "Saúde",
    "Lazer", "Educação", "Compras", "Freela", "Assinaturas", "Outros",
]

FORMAS_PAGAMENTO = ["credito", "debito", "pix", "dinheiro", "vr", "va"]

SYSTEM_PROMPT = f"""Você é um extrator de dados financeiros. Dada uma mensagem de WhatsApp descrevendo um gasto ou recebimento, devolva APENAS um JSON (sem texto extra, sem markdown) com os campos:
- "tipo": "entrada" ou "saida"
- "valor": número decimal positivo (ex: 45.90)
- "categoria": categoria do gasto/recebimento, preferindo uma destas quando fizer sentido: {", ".join(CATEGORIAS_SUGERIDAS)}. Se nenhuma se encaixar bem, use uma categoria curta e clara.
- "forma_pagamento": uma destas opções: {", ".join(FORMAS_PAGAMENTO)}, ou null se não for mencionada na mensagem

Responda somente com o JSON puro, sem blocos de código (não use ```), sem markdown e sem nenhum texto antes ou depois."""

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def _limpar_json(conteudo: str) -> str:
    conteudo = conteudo.strip()
    conteudo = _FENCE_RE.sub("", conteudo).strip()
    return conteudo


async def parse_mensagem(texto: str) -> dict:
    response = await _client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=200,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": texto}],
    )
    conteudo = response.content[0].text.strip()
    print("Resposta bruta do Claude:", repr(conteudo))
    conteudo = _limpar_json(conteudo)
    return json.loads(conteudo)
