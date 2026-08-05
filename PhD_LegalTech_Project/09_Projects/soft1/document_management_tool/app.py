from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse
import pdfplumber
import os

app = FastAPI()

UPLOAD_DIRECTORY = "uploads"

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_location = f"{UPLOAD_DIRECTORY}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(await file.read())
    return {"info": f"file '{file.filename}' saved at '{file_location}'"}

@app.get("/", response_class=HTMLResponse)
async def main():
    content = """
    <html>
        <body>
            <h2>Upload PDF File</h2>
            <form action="/upload/" enctype="multipart/form-data" method="post">
                <input name="file" type="file" accept=".pdf">
                <input type="submit">
            </form>
        </body>
    </html>
    """
    return content

@app.get("/extract/")
async def extract_text():
    extracted_text = ""
    for filename in os.listdir(UPLOAD_DIRECTORY):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(UPLOAD_DIRECTORY, filename)
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    extracted_text += page.extract_text() + "\n"
    return {"extracted_text": extracted_text}
