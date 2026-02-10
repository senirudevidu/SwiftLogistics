from fastapi import FastAPI
import logging

from app.database import SessionLocal, engine
from app.models import Clients, Base

app = FastAPI(title="Mock CMS Service")

async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logging.info("Database tables created successfully.")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Mock CMS Service!"}