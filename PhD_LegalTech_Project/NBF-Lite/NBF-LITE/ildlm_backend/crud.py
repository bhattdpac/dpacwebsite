from sqlalchemy.orm import Session
from . import models, schemas
from .security import get_password_hash

# =================================
# User CRUD
# =================================

def get_user(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        full_name=user.full_name,
        organization_id=user.organization_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# =================================
# Organization CRUD
# =================================

def get_organization(db: Session, org_id: str):
    return db.query(models.Organization).filter(models.Organization.id == org_id).first()

def create_organization(db: Session, organization: schemas.OrganizationCreate):
    db_organization = models.Organization(name=organization.name)
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    return db_organization

# =================================
# Document CRUD
# =================================

def create_document(db: Session, document: schemas.DocumentCreate, user_id: str):
    db_document = models.Document(
        **document.dict(), 
        uploaded_by_user_id=user_id
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def get_documents_by_org(db: Session, org_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.Document).filter(models.Document.organization_id == org_id).offset(skip).limit(limit).all()
