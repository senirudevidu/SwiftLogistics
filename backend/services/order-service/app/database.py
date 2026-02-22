from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession # type: ignore
from sqlalchemy.orm import sessionmaker, declarative_base # type: ignore
import os

# Use environment variable from docker-compose
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://swiftlog_user:swiftlog_pass@postgres:5432/swiftlog_db"
)

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()
