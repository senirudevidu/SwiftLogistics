from fastapi import FastAPI

app = FastAPI(title="ROS Mock System")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Route Optimization System Mock"}


