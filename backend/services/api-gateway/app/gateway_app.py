from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="API Gateway")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the API Gateway"}

@app.post("/login")
async def login(request: Request):
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

