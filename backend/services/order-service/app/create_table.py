import asyncio
from app.database import engine, Base
from app.models import Order  # Import models to register them

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        print("Creating database tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
