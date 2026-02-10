from fastapi import FastAPI # type: ignore
import logging

from app.database import engine, Base, SessionLocal
from app.models import User, Base

app = FastAPI(title="Authentication Service")

async def init_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:   
            await session.close()

@app.on_event("startup")
async def on_startup():
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logging.info("Database tables created successfully.")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Authentication Service!"}