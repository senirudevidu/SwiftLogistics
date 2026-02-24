from fastapi import FastAPI, Request, HTTPException, Depends # type: ignore
from fastapi.responses import Response # type: ignore
import logging
import xml.etree.ElementTree as ET

from sqlalchemy.future import select

from app.database import SessionLocal, engine
from app.models import Clients, Base

app = FastAPI(title="Mock CMS Service")

# XML namespaces for SOAP parsing
NAMESPACES = {
    'soap': 'http://schemas.xmlsoap.org/soap/envelope/',
    'cms': 'http://cms.legacy.system/schema'
}


async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def parse_soap_create_user(soap_xml: str) -> dict:
    """Parse SOAP XML envelope and extract user data"""
    try:
        root = ET.fromstring(soap_xml)
        
        # Find the CreateUserRequest element
        body = root.find('soap:Body', NAMESPACES)
        if body is None:
            raise ValueError("SOAP Body not found")
        
        create_user_request = body.find('cms:CreateUserRequest', NAMESPACES)
        if create_user_request is None:
            raise ValueError("CreateUserRequest not found in SOAP Body")
        
        name = create_user_request.find('cms:Name', NAMESPACES)
        email = create_user_request.find('cms:Email', NAMESPACES)
        
        if name is None or email is None:
            raise ValueError("Name or Email not found in CreateUserRequest")
        
        return {
            "name": name.text,
            "email": email.text
        }
    except ET.ParseError as e:
        raise ValueError(f"Invalid XML: {str(e)}")


def create_soap_response(message: str, success: bool = True) -> str:
    """Create a SOAP XML response envelope"""
    status = "Success" if success else "Failure"
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cms="http://cms.legacy.system/schema">
    <soap:Header/>
    <soap:Body>
        <cms:CreateUserResponse>
            <cms:Status>{status}</cms:Status>
            <cms:Message>{message}</cms:Message>
        </cms:CreateUserResponse>
    </soap:Body>
</soap:Envelope>"""


@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logging.info("Database tables created successfully.")


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Mock CMS Service!"}


@app.post("/soap/users")
async def create_user_soap(request: Request):
    """
    SOAP endpoint for creating users.
    Accepts SOAP XML, parses it, and stores user in database.
    """
    # Read raw SOAP XML body
    soap_xml = await request.body()
    soap_xml_str = soap_xml.decode("utf-8")
    
    logging.info(f"Received SOAP request:\n{soap_xml_str}")
    
    try:
        # Parse SOAP XML to extract user data
        user_data = parse_soap_create_user(soap_xml_str)
        
        # Create client in database
        new_client = Clients(name=user_data["name"], email=user_data["email"])
        async with SessionLocal() as session:
            session.add(new_client)
            await session.commit()
            await session.refresh(new_client)
        
        # Return SOAP XML response
        response_xml = create_soap_response(f"User {new_client.name} created successfully with ID {new_client.client_id}")
        logging.info(f"SOAP response:\n{response_xml}")
        
        return Response(
            content=response_xml,
            media_type="application/soap+xml; charset=utf-8"
        )
        
    except ValueError as e:
        logging.error(f"Error parsing SOAP XML: {e}")
        error_response = create_soap_response(str(e), success=False)
        return Response(
            content=error_response,
            media_type="application/soap+xml; charset=utf-8",
            status_code=400
        )


@app.get("/clients")
async def get_clients():
    """REST endpoint to list all clients stored in the CMS."""
    async with SessionLocal() as session:
        result = await session.execute(select(Clients))
        clients = result.scalars().all()
        return [
            {
                "client_id": c.client_id,
                "name": c.name,
                "email": c.email,
            }
            for c in clients
        ]
