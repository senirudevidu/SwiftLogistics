from fastapi import FastAPI, HTTPException, Depends # type: ignore
from fastapi.security import OAuth2PasswordBearer # type: ignore
from datetime import datetime, timedelta, timezone
import logging
from jose import jwt, JWTError # type: ignore
from passlib.context import CryptContext # type: ignore
from sqlalchemy.future import select # type: ignore

from app.database import engine, Base, SessionLocal
from app.models import User, Base
from app.schemas import UserCreate, LoginRequest


app = FastAPI(title="Authentication Service")

SECRET_KEY = "secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


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
        return {"username": username, "role": role}
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
    # Drop and recreate database tables (for development)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    logging.info("Database tables recreated successfully.")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Authentication Service!"}

@app.post("/users")
async def create_user(user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    new_user = User(username=user.username, password_hash=hashed_password, role=user.role)
    async with SessionLocal() as session:
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
    return {"message": f"User {new_user.username} created successfully."}

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
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer"}


@app.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info (protected endpoint)"""
    return {
        "Hello World"
    }
