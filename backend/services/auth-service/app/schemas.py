from pydantic import BaseModel # type: ignore

class UserCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str
    role: str

class LoginRequest(BaseModel):
    username: str
    password: str