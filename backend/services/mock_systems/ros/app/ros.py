from fastapi import FastAPI


from pydantic import BaseModel
import random
import requests

app = FastAPI(title="ROS Mock System")

class OrderRequest(BaseModel):
    order_id: int
    # Add other fields as needed

@app.post("/process_order")
def process_order(order: OrderRequest):
    # Hardcoded routes and drivers
    routes = [
        {"route_id": 1, "path": "A-B-C"},
        {"route_id": 2, "path": "A-D-E"},
        {"route_id": 3, "path": "B-E-F"}
    ]
    # Fetch drivers from driver-service
    try:
        resp = requests.get("http://driver-service:8000/drivers", timeout=5)
        drivers = resp.json() if resp.status_code == 200 else []
    except Exception as e:
        print(f"Failed to fetch drivers: {e}")
        drivers = []
    selected_route = random.choice(routes)
    selected_driver = random.choice(drivers) if drivers else None
    # Simulate sending result to respective section (placeholder)
    result = {
        "order_id": order.order_id,
        "route": selected_route,
        "driver": selected_driver
    }
    print(f"Assigned: {result}")
    return result


@app.get("/")
def read_root():
    return {"message": "Welcome to the Route Optimization System Mock"}


