from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from . import models, schemas, crud, security, blockchain_service
from .database import engine, get_db

# This command creates all the tables defined in models.py
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intelligent Legal Document Lifecycle Management (ILDLM) API",
    description="The backend service for the ILDLM framework.",
    version="0.1.0",
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# =================================
# API Endpoints
# =================================

@app.get("/")
def read_root():
    """A simple endpoint to confirm the service is running."""
    return {"message": "ILDLM Backend is running!"}

@app.get("/api/v1/status")
def get_status():
    """Returns the operational status of the API."""
    return {"status": "ok", "service": "ILDLM API", "version": "0.1.0"}

@app.get("/api/v1/blockchain/status")
async def get_blockchain_status():
    """
    Connects to the blockchain peer and retrieves its status.
    This verifies the backend-to-blockchain connection.
    """
    return await blockchain_service.blockchain_service.get_blockchain_info()

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/api/v1/users/me", response_model=schemas.User)
def read_users_me(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    # This is a placeholder for proper token validation
    # In a real app, you'd decode the token to get the user email
    # For now, we'll just return the first user as an example
    user = db.query(models.User).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/v1/organizations/", response_model=schemas.Organization)
def create_organization(org: schemas.OrganizationCreate, db: Session = Depends(get_db)):
    return crud.create_organization(db=db, organization=org)

@app.post("/api/v1/documents/", response_model=schemas.Document)
def create_document(document: schemas.DocumentCreate, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    # Placeholder for getting user_id from token
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return crud.create_document(db=db, document=document, user_id=user.id)

@app.get("/api/v1/documents/{org_id}", response_model=List[schemas.Document])
def get_documents(org_id: str, db: Session = Depends(get_db)):
    return crud.get_documents_by_org(db=db, org_id=org_id)