from pydantic import BaseModel

class CreateOrder(BaseModel):
    customer_id: int
    product_id: int
    delivery_address: str

