from sqlalchemy import Column, Integer, String  # type: ignore
from sqlalchemy.sql import func  # type: ignore
from app.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    client_id = Column(Integer, nullable=True)  # CMS client_id for client users
