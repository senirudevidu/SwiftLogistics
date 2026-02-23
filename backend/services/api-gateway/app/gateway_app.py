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


def require_admin(request: Request) -> dict:
    """Extract and verify the token, then ensure the user is an admin."""
    token = extract_token(request)
    payload = verify_token(token)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can perform this action")
    return payload


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
    require_admin(request)

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
        "driver_id": payload.get("driver_id"),
    }


# ─── Admin Routes ──────────────────────────────────────────────

@app.post("/admin/clients")
async def create_client(request: Request):
    """
    Admin creates a new client user.
    Proxies to auth-service POST /users with role=client.
    """
    require_admin(request)
    user_data = await request.json()
    # Ensure the role is set to client
    user_data["role"] = "client"

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


@app.get("/admin/clients")
async def get_clients(request: Request):
    """
    Admin lists all client users.
    Proxies to admin-service GET /clients.
    """
    require_admin(request)
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://admin-service:8000/clients")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as exc:
            logger.error(f"Error fetching clients: {exc}")
            return []


@app.post("/admin/drivers")
async def create_driver(request: Request):
    """
    Admin creates a new driver user.
    Proxies to auth-service POST /users with role=driver.
    """
    require_admin(request)
    user_data = await request.json()
    # Ensure the role is set to driver
    user_data["role"] = "driver"

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


@app.get("/admin/drivers")
async def get_drivers(request: Request):
    """
    Admin lists all driver users.
    Proxies to admin-service GET /drivers.
    """
    require_admin(request)
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://admin-service:8000/drivers")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as exc:
            logger.error(f"Error fetching drivers: {exc}")
            return []


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


# ─── Client Order Routes ────────────────────────────────────────

@app.get("/orders/my")
async def get_my_orders(request: Request):
    """
    Get all orders for the logged-in client.
    Extracts client_id from JWT and queries order service.
    """
    token = extract_token(request)
    payload = verify_token(token)

    if payload.get("role") != "client":
        raise HTTPException(status_code=403, detail="Only clients can access their orders")

    client_id = payload.get("client_id")
    if client_id is None:
        raise HTTPException(status_code=403, detail="Token does not contain client_id")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"http://order-service:8000/orders/client/{client_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as exc:
            logger.error(f"Error fetching client orders: {exc}")
            return []


# ─── Driver Routes ──────────────────────────────────────────────

@app.get("/driver/orders")
async def get_driver_orders(request: Request):
    """
    Get all orders assigned to the logged-in driver.
    Extracts driver_id from JWT and queries order service.
    """
    token = extract_token(request)
    payload = verify_token(token)

    if payload.get("role") != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can access this route")

    driver_id = payload.get("driver_id")
    if driver_id is None:
        raise HTTPException(status_code=403, detail="Token does not contain driver_id")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"http://order-service:8000/orders/driver/{driver_id}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as exc:
            logger.error(f"Error fetching driver orders: {exc}")
            return []


@app.put("/driver/orders/{order_id}/status")
async def update_driver_order_status(order_id: int, request: Request):
    """
    Driver marks an order as delivered or delivery_failed.
    Extracts driver_id from JWT for authorization.
    """
    token = extract_token(request)
    payload = verify_token(token)

    if payload.get("role") != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can update delivery status")

    driver_id = payload.get("driver_id")
    if driver_id is None:
        raise HTTPException(status_code=403, detail="Token does not contain driver_id")

    body = await request.json()
    status_update = {
        "order_id": order_id,
        "driver_id": driver_id,
        "status": body.get("status")
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.put(
                "http://order-service:8000/update-delivery-status",
                json=status_update
            )
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
            logger.error(f"Error updating delivery status: {exc}")
            raise HTTPException(status_code=500, detail=str(exc))

