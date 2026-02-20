from fastapi import FastAPI, Request # type: ignore
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
    return await response.json()

@app.post("/order")
async def create_order(request: Request):
    order_data = await request.json()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post("http://order-service:8000/create", json=order_data)
            response.raise_for_status()
            return await response.json()
        except httpx.HTTPStatusError as exc:
            # Try to parse the response as JSON; if successful, return it as a normal response
            try:
                data = await exc.response.json()
                return data
            except Exception:
                # If not JSON, return as error with text details
                details = await exc.response.aread()
                return {"error": f"Order service returned status {exc.response.status_code}", "details": details.decode("utf-8", errors="replace")}
        except Exception as exc:
            # Fallback: try to get the response text if available, else show the exception string
            details = None
            try:
                if 'response' in locals() and hasattr(response, 'aread'):
                    details = (await response.aread()).decode("utf-8", errors="replace")
            except Exception:
                pass
            return {"error": "Failed to contact order service", "details": details or str(exc)}

