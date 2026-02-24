import requests
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Query  # type: ignore
from fastapi.security import OAuth2PasswordBearer  # type: ignore
from datetime import datetime, timedelta, timezone
import logging
from jose import jwt, JWTError  # type: ignore
from passlib.context import CryptContext  # type: ignore
from sqlalchemy.future import select  # type: ignore

from app.database import engine, Base, SessionLocal
from app.models import User, Base
from app.schemas import UserCreate, LoginRequest


app = FastAPI(title="Authentication Service")

SECRET_KEY = "secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

async def init_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:   
            await session.close()

@app.on_event("startup")
async def on_startup():
    # Create database tables if they don't exist (preserves existing data)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logging.info("Database tables verified/created successfully.")

    # Add default users for admin, client, and driver dashboards
    async with SessionLocal() as session:
        users = [
            {"username": "admin", "password": "admin123", "role": "admin"},
            {"username": "client", "password": "client123", "role": "client"},
            {"username": "driver", "password": "driver123", "role": "driver"}
        ]
        for u in users:
            result = await session.execute(select(User).where(User.username == u["username"]))
            existing = result.scalar_one_or_none()
            if not existing:
                hashed_password = pwd_context.hash(u["password"])
                new_user = User(username=u["username"], password_hash=hashed_password, role=u["role"])
                session.add(new_user)
        await session.commit()
        # Log all users after creation for debugging
        result = await session.execute(select(User))
        all_users = result.scalars().all()
        logger.info(f"Users in DB after startup: {[{'username': u.username, 'role': u.role} for u in all_users]}")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Authentication Service!"}

@app.post("/users")
async def create_user(user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    new_user = User(username=user.username, password_hash=hashed_password, role=user.role)

    # For clients: create in CMS via adapter, get back client_id
    client_id = None
    driver_id = None

    if user.role == "client":
        try:
            resp = requests.post("http://cms-adapter:8000/users", json={"name": user.name, "email": user.email})
            resp.raise_for_status()
            logger.info(f"CMS adapter response: {resp.json()}")
            # Parse client_id from CMS SOAP response message
            cms_data = resp.json()
            # The CMS response message contains "created successfully with ID <n>"
            msg = cms_data.get("cms_response", "")
            if "ID " in msg:
                # Extract the ID that appears right after "ID "
                import re
                match = re.search(r'ID\s+(\d+)', msg)
                if match:
                    client_id = int(match.group(1))
                    logger.info(f"Extracted client_id from CMS: {client_id}")
        except Exception as e:
            logger.error(f"Error creating client in CMS: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create client in CMS: {str(e)}")
    elif user.role == "driver":
        try:
            resp = requests.post("http://driver-service:8000/users", json={"name": user.name, "email": user.email, "vehicle_number": user.vehicle_number})
            resp.raise_for_status()
            driver_data = resp.json()
            logger.info(f"Driver service response: {driver_data}")
            # Extract driver_id from driver service response
            if "driver_id" in driver_data:
                driver_id = driver_data["driver_id"]
                logger.info(f"Extracted driver_id: {driver_id}")
        except Exception as e:
            logger.error(f"Error creating driver: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create driver: {str(e)}")

    # Store client_id / driver_id in the users table if applicable
    if client_id is not None:
        new_user.client_id = client_id
    if driver_id is not None:
        new_user.driver_id = driver_id

    async with SessionLocal() as session:
        # Check if username already exists
        existing = await session.execute(select(User).where(User.username == user.username))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Username '{user.username}' already exists")
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)

    return {"message": f"User {new_user.username} created successfully.", "user_id": new_user.id, "client_id": client_id, "driver_id": driver_id}

@app.post("/login")
async def login(request: LoginRequest):
    async with SessionLocal() as session:
        result = await session.execute(
            select(User).where(User.username == request.username)
        )
        user = result.scalar_one_or_none()
    
    if not user or not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.username,
        "role": user.role,
        "exp": expire
    }
    # Include client_id for client users so orders can extract it
    if user.role == "client" and user.client_id is not None:
        payload["client_id"] = user.client_id
    # Include driver_id for driver users so driver routes can extract it
    if user.role == "driver" and user.driver_id is not None:
        payload["driver_id"] = user.driver_id

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer", "username": user.username, "role": user.role}


@app.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info (protected endpoint)"""
    return {
        "username": current_user.get("sub"),
        "role": current_user.get("role"),
        "client_id": current_user.get("client_id"),
    }


@app.get("/users")
async def list_users(role: Optional[str] = Query(None)):
    """List all users, optionally filtered by role."""
    async with SessionLocal() as session:
        if role:
            result = await session.execute(select(User).where(User.role == role))
        else:
            result = await session.execute(select(User))
        users = result.scalars().all()
        return [
            {
                "id": u.id,
                "username": u.username,
                "role": u.role,
                "client_id": u.client_id,
                "driver_id": u.driver_id,
                "is_active": True,
            }
            for u in users
        ]
