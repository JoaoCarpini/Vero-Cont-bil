import secrets

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.auth import criar_token
from app.core.config import settings

router = APIRouter()


class LoginRequest(BaseModel):
    api_key: str


@router.post("/auth/login")
def login(payload: LoginRequest):
    if not secrets.compare_digest(payload.api_key, settings.DASHBOARD_API_KEY):
        raise HTTPException(status_code=401, detail="Chave de acesso inválida")

    return {
        "token": criar_token(),
        "expires_in": settings.JWT_EXPIRATION_HOURS * 3600,
    }
