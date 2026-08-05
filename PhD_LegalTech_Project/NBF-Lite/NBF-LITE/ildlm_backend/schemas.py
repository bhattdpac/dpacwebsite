import uuid
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# =================================
# Organization Schemas
# =================================

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        orm_mode = True

# =================================
# User Schemas
# =================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    organization_id: Optional[uuid.UUID] = None

class User(UserBase):
    id: uuid.UUID
    organization_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        orm_mode = True

# =================================
# Document Schemas
# =================================

class DocumentBase(BaseModel):
    title: str

class DocumentCreate(DocumentBase):
    organization_id: uuid.UUID
    
class Document(DocumentBase):
    id: uuid.UUID
    status: str
    organization_id: uuid.UUID
    uploaded_by_user_id: uuid.UUID
    created_at: datetime

    class Config:
        orm_mode = True

# =================================
# Token Schemas (for Auth)
# =================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
