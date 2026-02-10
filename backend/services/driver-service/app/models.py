from sqlalchemy import Column, Integer, String, DateTime # type: ignore
from sqlalchemy.sql import func # type: ignore
from app.database import Base

class Drivers(Base):
    __tablename__ = "drivers"

    driver_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    vehicle_number = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False) 
