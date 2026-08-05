import pytest
from fastapi.testclient import TestClient
from app.main import app
import os
import shutil

client = TestClient(app)

@pytest.fixture
def test_upload_dir():
    """टेस्ट अपलोड डायरेक्टरी बनाएं"""
    upload_dir = "test_uploads"
    os.makedirs(upload_dir, exist_ok=True)
    yield upload_dir
    shutil.rmtree(upload_dir)

def test_root_endpoint():
    """रूट एंडपॉइंट का परीक्षण"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert "version" in response.json()

def test_upload_pdf(test_upload_dir):
    """PDF अपलोड का परीक्षण"""
    # टेस्ट PDF फाइल बनाएं
    test_file = os.path.join(test_upload_dir, "test.pdf")
    with open(test_file, "wb") as f:
        f.write(b"%PDF-1.4\n%Test PDF file")
    
    with open(test_file, "rb") as f:
        response = client.post("/api/v1/upload/", files={"file": f})
    
    assert response.status_code == 200
    assert "id" in response.json()
    assert "message" in response.json()

def test_upload_invalid_file():
    """अमान्य फाइल अपलोड का परीक्षण"""
    test_file = "test.txt"
    with open(test_file, "w") as f:
        f.write("Test content")
    
    with open(test_file, "rb") as f:
        response = client.post("/api/v1/upload/", files={"file": f})
    
    assert response.status_code == 400
    os.remove(test_file)

def test_search_documents():
    """दस्तावेज खोज का परीक्षण"""
    response = client.get("/api/v1/search/", params={"query": "test"})
    assert response.status_code == 200
    assert "results" in response.json()

def test_get_document():
    """दस्तावेज प्राप्ति का परीक्षण"""
    # पहले एक दस्तावेज अपलोड करें
    test_file = "test.pdf"
    with open(test_file, "wb") as f:
        f.write(b"%PDF-1.4\n%Test PDF file")
    
    with open(test_file, "rb") as f:
        upload_response = client.post("/api/v1/upload/", files={"file": f})
    
    doc_id = upload_response.json()["id"]
    
    # दस्तावेज प्राप्त करें
    response = client.get(f"/api/v1/documents/{doc_id}")
    assert response.status_code == 200
    assert "id" in response.json()
    assert "title" in response.json()
    
    # टेस्ट फाइल को साफ़ करें
    os.remove(test_file)

def test_delete_document():
    """दस्तावेज डिलीशन का परीक्षण"""
    # पहले एक दस्तावेज अपलोड करें
    test_file = "test.pdf"
    with open(test_file, "wb") as f:
        f.write(b"%PDF-1.4\n%Test PDF file")
    
    with open(test_file, "rb") as f:
        upload_response = client.post("/api/v1/upload/", files={"file": f})
    
    doc_id = upload_response.json()["id"]
    
    # दस्तावेज डिलीट करें
    response = client.delete(f"/api/v1/documents/{doc_id}")
    assert response.status_code == 200
    
    # दस्तावेज अब मौजूद नहीं होना चाहिए
    get_response = client.get(f"/api/v1/documents/{doc_id}")
    assert get_response.status_code == 404
    
    # टेस्ट फाइल को साफ़ करें
    os.remove(test_file) 