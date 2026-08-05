# Main entry point for the Document Management Tool

import fitz  # PyMuPDF
import pdfplumber
import pytesseract
from PIL import Image

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_image(image_path):
    text = pytesseract.image_to_string(Image.open(image_path))
    return text

def main():
    print("Welcome to the Research Document Management Tool!")
    pdf_path = "uploads/sample.pdf"  # Updated to use the uploads directory

    extracted_text = extract_text_from_pdf(pdf_path)
    print("Extracted Text from PDF:")
    print(extracted_text)


if __name__ == "__main__":
    main()
