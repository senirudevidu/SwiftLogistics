from fastapi import FastAPI # type: ignore
import logging

from app.database import SessionLocal, engine # type: ignore
from app.models import Clients, Base # type: ignore
from app.schemas import UserCreateRequest

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

@app.post("/users")
async def create_user(user: UserCreateRequest):
    new_client = Clients(name=user.name, email=user.email)
    async with SessionLocal() as session:
        session.add(new_client)
        await session.commit()
        await session.refresh(new_client)
    return {"message": f"User {new_client.name} created successfully."}