from fastapi import FastAPI, HTTPException, Depends # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore
from sqlalchemy import select # type: ignore
from typing import List
import logging

from app.database import SessionLocal, engine
from app.models import Order, Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Order Service", version="1.0.0")

# Dependency to get DB session
async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

@app.on_event("startup")
async def startup():
    """Initialize database tables on startup"""
    logger.info("Starting Order Service...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified successfully!")

@app.get("/")
async def root():
    return {"service": "Order Service", "status": "running"}
