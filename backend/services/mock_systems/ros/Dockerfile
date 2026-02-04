# Use Python 3.11 image
FROM python:3.11

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app folder
COPY app/ ./app

# Run uvicorn for REST API
CMD ["uvicorn", "app.ros:app", "--host", "0.0.0.0", "--port", "8100"]
