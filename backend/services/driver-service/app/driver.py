from fastapi import FastAPI # type: ignore
import logging

from app.database import SessionLocal, engine
from app.models import Drivers, Base

from app.schemas import UserCreate
from fastapi import Depends
from sqlalchemy.future import select



from typing import List
app = FastAPI(title="Driver Service")

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
    return {"message": "Welcome to the Driver Service!"}


@app.post("/users")
async def create_user(user: UserCreate):
    new_driver = Drivers(name=user.name, email=user.email, vehicle_number=user.vehicle_number)
    async with SessionLocal() as session:
        session.add(new_driver)
        await session.commit()
        await session.refresh(new_driver)
    return {"message": f"User {new_driver.name} created successfully."}

# New endpoint to get all drivers
@app.get("/drivers")
async def get_drivers():
    async with SessionLocal() as session:
        result = await session.execute(select(Drivers))
        drivers = result.scalars().all()
        return [
            {
                "driver_id": d.driver_id,
                "name": d.name,
                "vehicle_number": d.vehicle_number,
                "email": d.email
            }
            for d in drivers
        ]