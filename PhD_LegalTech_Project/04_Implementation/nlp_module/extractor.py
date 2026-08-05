"""
ILDLM Framework - Legal Named Entity & Information Extractor
Module: nlp_module/extractor.py
"""

import re
from typing import Dict, Any, List
from .utils import clean_text, extract_regex_entities

class LegalExtractor:
    """
    Extracts structural components from legal agreements:
    - Parties (Disclosing Party, Receiving Party, Client, Provider)
    - Effective Date & Expiration Date
    - Governing Law & Jurisdiction
    - Consideration / Financial Terms
    """

    def __init__(self):
        self.party_keywords = ["BETWEEN", "AND", "BY AND BETWEEN", "PARTY OF THE FIRST PART", "DISCLOSING PARTY", "RECEIVING PARTY", "CONTRACTOR", "CLIENT"]

    def extract_parties(self, text: str) -> List[Dict[str, str]]:
        """Extract contracting parties from introductory paragraphs."""
        clean = clean_text(text)
        parties = []
        
        # Preamble regex search
        preamble = clean[:1500] # First 1500 chars usually state parties
        
        # Pattern e.g. "Party A ('Disclosing Party') ... Party B ('Receiving Party')"
        party_pattern = r'([A-Z][A-Za-z0-9\.\,\s]{2,45})\s*\((?:hereinafter\s+referred\s+to\s+as\s+[\"\']?|[\"\'])([^\"\']+)(?:[\"\']?\))\)'
        matches = re.findall(party_pattern, preamble)
        
        if matches:
            for legal_name, role in matches:
                parties.append({
                    "name": legal_name.strip(" ,.\n"),
                    "role": role.strip()
                })
        else:
            # Fallback simple extractor for common roles
            if "Client" in preamble and "Developer" in preamble:
                parties.append({"name": "Client Entity", "role": "Client"})
                parties.append({"name": "Developer Entity", "role": "Developer"})
            elif "Disclosing Party" in preamble and "Receiving Party" in preamble:
                parties.append({"name": "Disclosing Entity", "role": "Disclosing Party"})
                parties.append({"name": "Receiving Entity", "role": "Receiving Party"})
            else:
                parties.append({"name": "Party A", "role": "First Party"})
                parties.append({"name": "Party B", "role": "Second Party"})

        return parties

    def extract_governing_law(self, text: str) -> str:
        """Extract Governing Law / Jurisdiction clause."""
        pattern = r'(?:governed\s+by|laws\s+of|jurisdiction\s+of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return "Not Specified (Default Jurisdiction)"

    def extract_all(self, document_text: str) -> Dict[str, Any]:
        """Execute full entity extraction pipeline on document."""
        cleaned = clean_text(document_text)
        regex_ents = extract_regex_entities(cleaned)
        parties = self.extract_parties(cleaned)
        governing_law = self.extract_governing_law(cleaned)

        return {
            "document_summary": {
                "character_count": len(cleaned),
                "line_count": len(cleaned.splitlines())
            },
            "parties": parties,
            "governing_law": governing_law,
            "extracted_dates": regex_ents["dates"],
            "financial_values": regex_ents["monetary_amounts"],
            "percentages": regex_ents["percentages"]
        }
