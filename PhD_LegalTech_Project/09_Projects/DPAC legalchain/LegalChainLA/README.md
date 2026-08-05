# LegalChain Lit-Analyzer

A Streamlit-based web application for analyzing legal documents and extracting entities using NLP.

## Features

- 📂 Upload and process PDF documents
- 🧠 Extract entities using NLP
- 📊 View extracted entities in an interactive table
- 📈 Analyze entity distributions and patterns
- 📥 Export results to CSV

## Setup Instructions

### 1. Install Dependencies

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install -r requirements.txt
```

### 2. Prepare Your Documents

1. Create the required directories:
```bash
mkdir -p data/pdfs
mkdir -p data/extracted
```

2. Place your PDF documents in the `data/pdfs/` directory:
```bash
# Example: Copy your PDFs to the data/pdfs directory
cp /path/to/your/documents/*.pdf data/pdfs/
```

### 3. Run the Application

```bash
# Navigate to the project root directory
cd LegalChain-LitAnalyzer

# Start the Streamlit app
python -m streamlit run dashboard/app.py
```

The application will be available at: http://localhost:8501

## Usage

1. **PDF Upload**
   - Upload new PDF files through the web interface
   - Or select from existing files in the `data/pdfs/` directory

2. **Entity Viewer**
   - View extracted entities in an interactive table
   - Filter and search through entities

3. **Analytics View**
   - View entity distribution charts
   - Analyze patterns in the extracted data

4. **Download Results**
   - Export extracted entities as CSV
   - Download processed results for further analysis

## Project Structure

```
LegalChain-LitAnalyzer/
├── dashboard/
│   └── app.py              # Streamlit web application
├── src/
│   ├── pdf_reader.py       # PDF text extraction
│   ├── entity_detector.py  # Entity detection logic
│   ├── export_to_csv.py    # CSV export functionality
│   └── analyzer_utils.py   # Utility functions
├── data/
│   ├── pdfs/              # Input PDF documents
│   └── extracted/         # Output CSV files
├── models/                # NLP models
├── logs/                  # Application logs
└── requirements.txt       # Python dependencies
```

## Requirements

- Python 3.8+
- Streamlit
- PyMuPDF (fitz)
- spaCy
- pandas
- Other dependencies listed in requirements.txt

## Contributing

Feel free to submit issues and enhancement requests! 