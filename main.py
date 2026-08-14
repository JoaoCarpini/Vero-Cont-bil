from fastapi import FastAPI

from app import models  # noqa: F401 - garante que os models sejam registrados no Base
from app.api.routes import import_csv, telegram
from app.db.database import Base, engine, ensure_schema, seed_dados_iniciais

Base.metadata.create_all(bind=engine)
ensure_schema()
seed_dados_iniciais()

app = FastAPI(title="Vero Contábil")

app.include_router(telegram.router, prefix="/webhook", tags=["telegram"])
app.include_router(import_csv.router, prefix="/import", tags=["import"])


@app.get("/")
def root():
    return {"status": "ok"}
