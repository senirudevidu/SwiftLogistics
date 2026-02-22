from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Admin Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Welcome to the Admin Service"}


@app.post("/register-user")
async def register_user(request: Request):
    """
    Admin creates a new user (client or driver).
    Expects JSON body with: name, email, username, password, role, vehicle_number (optional).
    Proxies to auth-service.
    """
    user_data = await request.json()
    logger.info(f"Admin registering user: {user_data.get('username')} as {user_data.get('role')}")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post("http://auth-service:8000/users", json=user_data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            try:
                data = exc.response.json()
                raise HTTPException(status_code=exc.response.status_code, detail=data.get("detail", str(data)))
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as exc:
            logger.error(f"Error registering user: {exc}")
            raise HTTPException(status_code=500, detail=str(exc))
