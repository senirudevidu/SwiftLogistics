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


@app.get("/clients")
async def get_clients():
    """
    List all client users from the auth-service users table.
    Proxies to auth-service GET /users?role=client.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://auth-service:8000/users", params={"role": "client"})
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(f"Error fetching clients: {exc}")
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as exc:
            logger.error(f"Error fetching clients: {exc}")
            return []


@app.get("/drivers")
async def get_drivers():
    """
    List all driver users from the auth-service users table.
    Proxies to auth-service GET /users?role=driver.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://auth-service:8000/users", params={"role": "driver"})
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(f"Error fetching drivers: {exc}")
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as exc:
            logger.error(f"Error fetching drivers: {exc}")
            return []


@app.get("/orders")
async def get_orders():
    """
    List all orders from the order-service.
    Enriches each order with client_username from auth-service.
    """
    async with httpx.AsyncClient() as client:
        # Fetch all orders from order-service
        try:
            orders_resp = await client.get("http://order-service:8000/orders")
            orders_resp.raise_for_status()
            orders = orders_resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error(f"Error fetching orders: {exc}")
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as exc:
            logger.error(f"Error fetching orders: {exc}")
            return []

        # Fetch all users from auth-service for username enrichment
        client_username_map = {}   # client_id -> username
        driver_username_map = {}   # driver_id -> username
        try:
            users_resp = await client.get("http://auth-service:8000/users")
            users_resp.raise_for_status()
            users = users_resp.json()
            for u in users:
                if u.get("client_id") is not None:
                    client_username_map[u["client_id"]] = u.get("username", "Unknown")
                if u.get("driver_id") is not None:
                    driver_username_map[u["driver_id"]] = u.get("username", "Unknown")
        except Exception as exc:
            logger.warning(f"Could not fetch users for enrichment: {exc}")

        # Fetch client names from CMS mock (where actual client names are stored)
        client_name_map = {}  # client_id -> name
        try:
            cms_resp = await client.get("http://cms-mock:8200/clients")
            cms_resp.raise_for_status()
            cms_clients = cms_resp.json()
            for c in cms_clients:
                client_name_map[c["client_id"]] = c.get("name", "Unknown")
        except Exception as exc:
            logger.warning(f"Could not fetch clients from CMS for enrichment: {exc}")

        # Fetch driver details from driver-service for actual names
        driver_name_map = {}  # driver_id -> name
        try:
            drivers_resp = await client.get("http://driver-service:8000/drivers")
            drivers_resp.raise_for_status()
            drivers = drivers_resp.json()
            for d in drivers:
                driver_name_map[d["driver_id"]] = d.get("name", "Unknown")
        except Exception as exc:
            logger.warning(f"Could not fetch drivers for enrichment: {exc}")

        # Enrich orders with names and usernames
        for order in orders:
            cid = order.get("client_id")
            did = order.get("driver_id")
            order["client_name"] = client_name_map.get(cid) if cid else None
            order["client_username"] = client_username_map.get(cid) if cid else None
            order["driver_name"] = driver_name_map.get(did) if did else None
            order["driver_username"] = driver_username_map.get(did) if did else None

        return orders

