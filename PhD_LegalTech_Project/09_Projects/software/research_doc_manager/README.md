# Research Document Management & Extraction Tool

A powerful tool for processing, extracting, and managing research papers and documents.

## Key Features

- Text extraction from PDFs and scanned documents
- Processing of scanned documents through OCR
- Intelligent data extraction (title, authors, abstract, keywords, etc.)
- Structured data storage
- Advanced search and query system
- AI-powered analysis and automation
- Export support in various formats

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd research_doc_manager
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows
```

3. Install required packages:
```bash
pip install -r requirements.txt
```

4. Install Tesseract OCR:
- Windows: [Tesseract Installer](https://github.com/UB-Mannheim/tesseract/wiki)
- Linux: `sudo apt-get install tesseract-ocr`
- Mac: `brew install tesseract`

## Usage

1. Start the server:
```bash
uvicorn app.main:app --reload
```

2. Access web interface:
```
http://localhost:8000
```

## API Documentation

API documentation is available at:
```
http://localhost:8000/docs
```

## License

MIT License 