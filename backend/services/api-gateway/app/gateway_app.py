from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="API Gateway")

# CORS middleware so frontend can call the gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Must match auth-service secret
SECRET_KEY = "secret"
ALGORITHM = "HS256"


def verify_token(token: str) -> dict:
    """Verify JWT token and return the payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")


def extract_token(request: Request) -> str:
    """Extract Bearer token from the Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return auth_header.split(" ", 1)[1]


@app.get("/")
async def root():
    return {"message": "Welcome to the API Gateway"}


# ─── Auth Routes ────────────────────────────────────────────────

@app.post("/login")
async def login(request: Request):
    """Proxy login to auth-service (internal port 8000)."""
    # Handle both form data (from frontend) and JSON
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        credentials = {"username": form_data.get("username"), "password": form_data.get("password")}
    else:
        credentials = await request.json()

    async with httpx.AsyncClient() as client:
        response = await client.post("http://auth-service:8000/login", json=credentials)
        # Return with proper status code
        return Response(
            content=response.content,
            status_code=response.status_code,
            media_type="application/json"
        )


@app.post("/register")
async def register(request: Request):
    """
    Admin registers a new user (client or driver).
    Requires admin JWT token in Authorization header.
    Proxies to auth-service POST /users.
    """
    # Verify admin token
    token = extract_token(request)
    payload = verify_token(token)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can register users")

    user_data = await request.json()
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


@app.get("/me")
async def get_me(request: Request):
    """Get current user info from JWT token."""
    token = extract_token(request)
    payload = verify_token(token)
    return {
        "username": payload.get("sub"),
        "role": payload.get("role"),
        "client_id": payload.get("client_id"),
    }


# ─── Order Routes ───────────────────────────────────────────────

@app.post("/order")
async def create_order(request: Request):
    """
    Create an order. Requires valid JWT token.
    Extracts client_id from the JWT payload and injects it into the order data.
    """
    # Verify token and extract client_id
    token = extract_token(request)
    payload = verify_token(token)

    client_id = payload.get("client_id")
    if client_id is None:
        raise HTTPException(status_code=403, detail="Token does not contain client_id. Only clients can place orders.")

    order_data = await request.json()
    # Inject client_id from the JWT token
    order_data["customer_id"] = client_id

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post("http://order-service:8000/create", json=order_data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            try:
                data = exc.response.json()
                return data
            except Exception:
                details = await exc.response.aread()
                return {"error": f"Order service returned status {exc.response.status_code}", "details": details.decode("utf-8", errors="replace")}
        except Exception as exc:
            details = None
            try:
                if 'response' in locals() and hasattr(response, 'aread'):
                    details = (await response.aread()).decode("utf-8", errors="replace")
            except Exception:
                pass
            return {"error": "Failed to contact order service", "details": details or str(exc)}
