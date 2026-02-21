from fastapi import FastAPI, HTTPException, Depends # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore
from sqlalchemy import select # type: ignore
from typing import List
import logging
from app.schemas import CreateOrder

from app.database import SessionLocal, engine
from app.models import Order, Base

from app.rabbitmq_publisher import publish_order

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

@app.post("/create")
async def create_order(order: CreateOrder, db: AsyncSession = Depends(get_db)):
    new_order = Order(
        client_id=order.customer_id,
        status="pending"
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    logger.info(f"Created new order with ID: {new_order.order_id}")
    publish_order({
        "order_id": new_order.order_id,
        "client_id": new_order.client_id,
        "status": new_order.status
    })
    return {"message": "Order created successfully", "order_id": new_order.order_id}
