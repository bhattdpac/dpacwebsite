from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
from .api.routes import router

app = FastAPI(
    title="Research Document Manager",
    description="A powerful research document management and extraction tool",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Research Document Manager API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.post("/upload/")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF or scanned document
    """
    if not file.filename.endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Only PDF and image files are allowed")
    
    # TODO: Add file processing logic
    return {"filename": file.filename, "status": "success"}

@app.get("/search/")
async def search_documents(query: str):
    """
    Search in documents
    """
    # TODO: Add search logic
    return {"query": query, "results": []}

@app.get("/documents/")
async def list_documents():
    """
    Get list of all stored documents
    """
    # TODO: Add document listing logic
    return {"documents": []}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 