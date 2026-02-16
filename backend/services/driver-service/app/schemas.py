from pydantic import BaseModel # type: ignore

class UserCreate(BaseModel):
    name: str
    email: str
    vehicle_number: str
    
