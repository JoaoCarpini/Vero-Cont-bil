from fastapi import FastAPI

from app import models  # noqa: F401 - garante que os models sejam registrados no Base
from app.api.routes import webhook
from app.db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vero Contábil")

app.include_router(webhook.router, prefix="/webhook", tags=["webhook"])


@app.get("/")
def root():
    return {"status": "ok"}
