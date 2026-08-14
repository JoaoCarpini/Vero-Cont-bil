from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 - garante que os models sejam registrados no Base
from app.api.routes import dashboard, import_csv, telegram
from app.core.config import settings
from app.db.database import Base, engine, ensure_schema, seed_dados_iniciais

Base.metadata.create_all(bind=engine)
ensure_schema()
seed_dados_iniciais()

app = FastAPI(title="Vero Contábil")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_methods=["GET", "POST"],
    allow_headers=["X-Api-Key", "Content-Type"],
)

app.include_router(telegram.router, prefix="/webhook", tags=["telegram"])
app.include_router(import_csv.router, prefix="/import", tags=["import"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])


@app.get("/")
def root():
    return {"status": "ok"}
