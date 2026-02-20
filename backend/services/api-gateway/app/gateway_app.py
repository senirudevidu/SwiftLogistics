from fastapi import FastAPI, Request
import httpx

app = FastAPI(title="API Gateway")

@app.get("/")
async def root():
    return {"message": "Welcome to the API Gateway"}

@app.post("/login")
async def login(request: Request):
    credentials = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post("http://auth-service:8001/login", json=credentials)
    return response.json()

@app.post("/order")
async def create_order(request: Request):
    order_data = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post("http://order-service:8002/create", json=order_data)
    return response.json()

