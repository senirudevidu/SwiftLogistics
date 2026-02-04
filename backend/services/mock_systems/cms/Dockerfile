FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app

# Run SOAP server with Python
CMD ["python", "app/cms_mock.py"]
