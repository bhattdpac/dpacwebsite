"""
ILDLM Framework - Legal Text Utilities & Helper Functions
Module: nlp_module/utils.py
"""

import re
import unicodedata
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    """Normalize whitespace and standard Unicode characters in legal text."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    # Replace multiple spaces/newlines with single clean spaces
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)

def split_into_clauses(text: str) -> List[Dict[str, Any]]:
    """
    Splits legal document text into numbered sections or paragraph-level clauses.
    Identifies clause numbers/headings like '1. Scope of Work', 'SECTION 2:', etc.
    """
    clean_raw = clean_text(text)
    # Split by double newlines or numbered section patterns
    clause_pattern = r'(?=(?:^|\n)\s*(?:SECTION|\d+[\.\)]|[A-Z][A-Z\s]{2,}:))'
    raw_chunks = re.split(clause_pattern, clean_raw, flags=re.MULTILINE)
    
    clauses = []
    idx = 1
    for chunk in raw_chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        
        # Extract title if present
        first_line = chunk.split('\n')[0]
        title = first_line[:60] if len(first_line) > 60 else first_line
        
        clauses.append({
            "clause_id": f"C-{idx:02d}",
            "heading": title,
            "content": chunk
        })
        idx += 1
        
    return clauses

def extract_regex_entities(text: str) -> Dict[str, List[str]]:
    """Extract standard legal entities using robust regex rules."""
    entities = {
        "dates": [],
        "monetary_amounts": [],
        "percentages": [],
        "emails": []
    }
    
    # Date formats (e.g. 12th July 2026, 2026-08-04, July 12, 2026)
    date_pattern = r'\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}-\d{2}-\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})\b'
    entities["dates"] = list(set(re.findall(date_pattern, text, re.IGNORECASE)))
    
    # Monetary amounts (e.g., $10,000, INR 50,000, 5,000 USD, $500.00)
    money_pattern = r'(?:[\$\€\£\₹]|USD|INR|EUR|GBP)?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|INR|EUR|GBP|Dollars|Rupees)?'
    raw_amounts = re.findall(money_pattern, text)
    entities["monetary_amounts"] = [amt.strip() for amt in raw_amounts if any(char.isdigit() for char in amt) and len(amt.strip()) > 1]
    
    # Percentages (e.g. 5%, 10.5 percent)
    percent_pattern = r'\b\d+(?:\.\d+)?\s*(?:%|percent)\b'
    entities["percentages"] = list(set(re.findall(percent_pattern, text, re.IGNORECASE)))
    
    # Email addresses
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    entities["emails"] = list(set(re.findall(email_pattern, text)))
    
    return entities
