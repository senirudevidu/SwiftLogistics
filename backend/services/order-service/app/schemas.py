from pydantic import BaseModel
from typing import Optional

class CreateOrder(BaseModel):
    customer_id: int
    product_id: int
    delivery_address: str

class UpdateOrderStatus(BaseModel):
    order_id: int
    status: str

class AssignDriver(BaseModel):
    order_id: int
    driver_id: int

class UpdateDeliveryStatus(BaseModel):
    order_id: int
    driver_id: int
    status: str  # "delivered" or "delivery_failed"
