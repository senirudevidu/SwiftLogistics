from pydantic import BaseModel # type: ignore

class UserCreateRequest(BaseModel):
    name: str
    email: str