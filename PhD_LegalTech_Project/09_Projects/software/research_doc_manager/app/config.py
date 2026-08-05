import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # एप्लिकेशन सेटिंग्स
    APP_NAME: str = "Research Document Manager"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # डेटाबेस सेटिंग्स
    DATABASE_URL: str = "sqlite:///research_docs.db"
    
    # फाइल अपलोड सेटिंग्स
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: set = {"pdf", "png", "jpg", "jpeg"}
    
    # OCR सेटिंग्स
    TESSERACT_PATH: Optional[str] = None
    
    # सर्च सेटिंग्स
    SEARCH_RESULTS_PER_PAGE: int = 10
    MAX_SEARCH_RESULTS: int = 100
    
    # सिक्योरिटी सेटिंग्स
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API सेटिंग्स
    API_V1_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# ग्लोबल सेटिंग्स ऑब्जेक्ट
settings = Settings()

# डायरेक्टरी बनाएं
os.makedirs(settings.UPLOAD_DIR, exist_ok=True) 