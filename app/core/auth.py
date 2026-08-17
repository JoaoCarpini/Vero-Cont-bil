from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Header, HTTPException

from app.core.config import settings

ALGORITHM = "HS256"


def criar_token() -> str:
    agora = datetime.now(timezone.utc)
    payload = {
        "sub": "dashboard",
        "iat": agora,
        "exp": agora + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def verificar_jwt(authorization: str = Header(default="")) -> None:
    esquema, _, token = authorization.partition(" ")
    if esquema.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Token ausente")

    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada, faça login novamente")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
