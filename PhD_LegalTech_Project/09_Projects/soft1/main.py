import os
import json
import csv
import re
import logging
from typing import Dict, List, Any

# PDF and Image Processing Libraries
import fitz  # PyMuPDF for PDF reading
import pytesseract
import cv2
import numpy as np

# NLP and ML Libraries
import spacy
from transformers import pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Database and Search
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import elasticsearch

# Logging Configuration
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class ResearchDocumentExtractor:
    def __init__(self, db_path='research_docs.db', es_host='localhost'):
        """
        Initialize document extractor with database and search capabilities
        
        Args:
            db_path (str): Path to SQLite database
            es_host (str): Elasticsearch host
        """
        # PDF Processing Setup
        pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'
        
        # NLP Models
        self.nlp = spacy.load('en_core_web_sm')
        self.summarizer = pipeline('summarization')
        
        # Database Setup
        self.Base = declarative_base()
        self.engine = create_engine(f'sqlite:///{db_path}')
        self.SessionLocal = sessionmaker(bind=self.engine)
        
        # Elasticsearch Setup
        self.es = elasticsearch.Elasticsearch([es_host])
        
        # Create database tables
        self.create_tables()
    
    def create_tables(self):
        """Create database tables if they don't exist"""
        class Document(self.Base):
            __tablename__ = 'documents'
            id = Column(Integer, primary_key=True)
            title = Column(String)
            author = Column(String)
            abstract = Column(Text)
            keywords = Column(String)
            file_path = Column(String)
            processed_date = Column(DateTime)
        
        self.Base.metadata.create_all(self.engine)
    
    def preprocess_image(self, image_path):
        """
        Preprocess image for better OCR performance
        
        Args:
            image_path (str): Path to input image
        
        Returns:
            numpy.ndarray: Preprocessed image
        """
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray)
        _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return binary
    
    def extract_text_from_pdf(self, pdf_path, use_ocr=False):
        """
        Extract text from PDF, with optional OCR for scanned documents
        
        Args:
            pdf_path (str): Path to PDF file
            use_ocr (bool): Use OCR for scanned documents
        
        Returns:
            dict: Extracted document information
        """
        try:
            doc = fitz.open(pdf_path)
            full_text = ""
            
            for page in doc:
                if not use_ocr:
                    full_text += page.get_text()
                else:
                    # Convert page to image for OCR
                    pix = page.get_pixmap()
                    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
                    preprocessed_img = self.preprocess_image(img)
                    full_text += pytesseract.image_to_string(preprocessed_img)
            
            # NLP-based extraction
            doc_info = self.extract_document_info(full_text)
            doc_info['file_path'] = pdf_path
            
            return doc_info
        
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
            return {}
    
    def extract_document_info(self, text):
        """
        Use NLP to extract structured information from text
        
        Args:
            text (str): Full document text
        
        Returns:
            dict: Extracted document metadata
        """
        nlp_doc = self.nlp(text)
        
        # Entity extraction
        title = self._extract_title(text)
        authors = self._extract_authors(nlp_doc)
        keywords = self._extract_keywords(text)
        abstract = self._extract_abstract(text)
        citations = self._extract_citations(text)
        
        return {
            'title': title,
            'authors': authors,
            'keywords': keywords,
            'abstract': abstract,
            'citations': citations
        }
    
    def _extract_title(self, text):
        """Extract document title"""
        # Simple heuristic: first 1-2 lines, typically capitalized
        lines = text.split('\n')
        return lines[0] if lines else ""
    
    def _extract_authors(self, nlp_doc):
        """Extract authors using NER"""
        return [ent.text for ent in nlp_doc.ents if ent.label_ == 'PERSON']
    
    def _extract_keywords(self, text, top_k=5):
        """Extract top keywords using TF-IDF"""
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        
        # Get top keywords by TF-IDF score
        scores = dict(zip(feature_names, tfidf_matrix.toarray()[0]))
        return sorted(scores, key=scores.get, reverse=True)[:top_k]
    
    def _extract_abstract(self, text, max_length=300):
        """Extract or generate document abstract"""
        # Simple extraction or use summarization model
        sentences = text.split('.')
        abstract_candidates = [s for s in sentences if len(s.split()) > 10]
        
        if abstract_candidates:
            abstract = ' '.join(abstract_candidates[:3])
            return abstract[:max_length]
        
        return ""
    
    def _extract_citations(self, text):
        """Extract citations using regex patterns"""
        citation_patterns = [
            r'\[(\d+)\]',       # Numbered citations
            r'\([\w\s]+, \d{4}\)',  # Author-year citations
        ]
        
        citations = []
        for pattern in citation_patterns:
            citations.extend(re.findall(pattern, text))
        
        return citations
    
    def store_document(self, doc_info):
        """
        Store document information in database and Elasticsearch
        
        Args:
            doc_info (dict): Extracted document information
        """
        # Store in SQLite
        session = self.SessionLocal()
        document = {
            'title': doc_info.get('title', ''),
            'author': ', '.join(doc_info.get('authors', [])),
            'abstract': doc_info.get('abstract', ''),
            'keywords': ', '.join(doc_info.get('keywords', [])),
            'file_path': doc_info.get('file_path', '')
        }
        
        # Index in Elasticsearch for full-text search
        self.es.index(
            index='research_documents',
            body=document
        )
    
    def search_documents(self, query, filters=None):
        """
        Search documents using Elasticsearch
        
        Args:
            query (str): Search query
            filters (dict, optional): Additional search filters
        
        Returns:
            list: Matching documents
        """
        search_body = {
            "query": {
                "multi_match": {
                    "query": query,
                    "fields": ["title", "abstract", "keywords"]
                }
            }
        }
        
        if filters:
            search_body['query']['bool'] = {
                "must": [
                    {"match": {key: value}} for key, value in filters.items()
                ]
            }
        
        results = self.es.search(index='research_documents', body=search_body)
        return [hit['_source'] for hit in results['hits']['hits']]
    
    def export_to_bibtex(self, doc_info):
        """
        Generate BibTeX citation
        
        Args:
            doc_info (dict): Document information
        
        Returns:
            str: BibTeX formatted citation
        """
        bibtex_template = """
        @article{{{key},
            title = {{{title}}},
            author = {{{author}}},
            abstract = {{{abstract}}},
            keywords = {{{keywords}}}
        }}
        """
        
        key = '_'.join(doc_info.get('authors', ['unknown'])[0].split()).lower()
        return bibtex_template.format(
            key=key,
            title=doc_info.get('title', ''),
            author=' and '.join(doc_info.get('authors', [])),
            abstract=doc_info.get('abstract', ''),
            keywords=', '.join(doc_info.get('keywords', []))
        )

def main():
    extractor = ResearchDocumentExtractor()
    
    # Example usage
    pdf_path = 'research_paper.pdf'
    doc_info = extractor.extract_text_from_pdf(pdf_path, use_ocr=True)
    
    # Store document
    extractor.store_document(doc_info)
    
    # Search documents
    results = extractor.search_documents('machine learning')
    
    # Export to BibTeX
    bibtex = extractor.export_to_bibtex(doc_info)
    
    print(json.dumps(doc_info, indent=2))
    print("\nBibTeX Citation:\n", bibtex)

if __name__ == '__main__':
    main()
