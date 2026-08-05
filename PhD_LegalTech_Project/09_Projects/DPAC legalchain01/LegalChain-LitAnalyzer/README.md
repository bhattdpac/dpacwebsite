# LegalChain Lit-Analyzer

A Python-based academic literature analysis tool for extracting, analyzing, and structuring information from research papers related to blockchain, smart contracts, and legal applications.

## Features
- PDF text extraction (cleaned, multi-column support)
- Domain-specific entity detection (blockchain, legal, security, etc.)
- Export to CSV
- Streamlit dashboard for interactive analysis

## Folder Structure
```
LegalChain-LitAnalyzer/
│
├── data/
│   ├── pdfs/
│   └── extracted/
├── src/
│   ├── pdf_reader.py
│   ├── entity_detector.py
│   ├── export_to_csv.py
│   └── analyzer_utils.py
├── dashboard/
│   └── app.py
├── models/
├── logs/
├── requirements.txt
└── README.md
```

## TODO
- [ ] Implement PDF text extraction (`src/pdf_reader.py`)
- [ ] Build entity detection (`src/entity_detector.py`)
- [ ] Export structured data to CSV (`src/export_to_csv.py`)
- [ ] Create Streamlit dashboard (`dashboard/app.py`)
- [ ] Add ML/NLP models (`models/`)
- [ ] Set up logging (`logs/`) 