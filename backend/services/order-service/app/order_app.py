from fastapi import FastAPI, HTTPException, Depends # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession # type: ignore
from sqlalchemy import select # type: ignore
from typing import List
import logging
from app.schemas import CreateOrder, UpdateOrderStatus, AssignDriver

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
        delivery_address=order.delivery_address,
        status="pending"
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    logger.info(f"Created new order with ID: {new_order.order_id}")
    publish_order({
        "order_id": new_order.order_id,
        "client_id": new_order.client_id,
        "delivery_address": new_order.delivery_address,
        "status": new_order.status
    })
    return {"message": "Order created successfully", "order_id": new_order.order_id}

@app.put("/update-status")
async def update_order_status(data: UpdateOrderStatus, db: AsyncSession = Depends(get_db)):
    """Update order status (called by WMS Adapter)"""
    result = await db.execute(select(Order).where(Order.order_id == data.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {data.order_id} not found")
    order.status = data.status
    await db.commit()
    await db.refresh(order)
    logger.info(f"Order {data.order_id} status updated to: {data.status}")
    return {"message": f"Order {data.order_id} status updated to {data.status}"}

@app.put("/assign-driver")
async def assign_driver(data: AssignDriver, db: AsyncSession = Depends(get_db)):
    """Assign a driver to an order (called by ROS Adapter)"""
    result = await db.execute(select(Order).where(Order.order_id == data.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {data.order_id} not found")
    order.driver_id = data.driver_id
    await db.commit()
    await db.refresh(order)
    logger.info(f"Order {data.order_id} assigned to driver: {data.driver_id}")
    return {"message": f"Order {data.order_id} assigned to driver {data.driver_id}"}

