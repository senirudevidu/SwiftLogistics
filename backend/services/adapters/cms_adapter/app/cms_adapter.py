import os
import httpx
import logging
from fastapi import FastAPI, HTTPException # type: ignore
from app.schemas import UserCreateRequest

app = FastAPI(title="CMS Adapter Service")

CMS_URL = os.getenv("CMS_URL", "http://cms-mock:8200")

def json_to_soap_xml(user: UserCreateRequest) -> str:
    """Convert JSON user data to SOAP XML envelope for CMS legacy system"""
    soap_envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cms="http://cms.legacy.system/schema">
    <soap:Header/>
    <soap:Body>
        <cms:CreateUserRequest>
            <cms:Name>{user.name}</cms:Name>
            <cms:Email>{user.email}</cms:Email>
        </cms:CreateUserRequest>
    </soap:Body>
</soap:Envelope>"""
    return soap_envelope


@app.get("/")
async def read_root():
    return {"message": "Welcome to the CMS Adapter Service!"}


@app.post("/users")
async def create_user(user: UserCreateRequest):
    """
    Receives JSON from auth service, converts to SOAP XML, and sends to CMS.
    """
    # Convert JSON to SOAP XML
    soap_xml = json_to_soap_xml(user)
    logging.info(f"Generated SOAP XML:\n{soap_xml}")
    
    # Send SOAP XML to CMS legacy system
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CMS_URL}/soap/users",
                content=soap_xml,
                headers={
                    "Content-Type": "application/soap+xml; charset=utf-8",
                    "SOAPAction": "CreateUser"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"CMS returned error: {response.text}"
                )
            
            return {"message": f"User {user.name} created in CMS via SOAP", "cms_response": response.text}
            
    except httpx.RequestError as e:
        logging.error(f"Error communicating with CMS: {e}")
        raise HTTPException(status_code=503, detail=f"CMS service unavailable: {str(e)}")
