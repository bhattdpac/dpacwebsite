"""
ILDLM Framework - Legal Clause Parser
Module: nlp_module/parser.py
"""

import re
from typing import List, Dict, Any
from .utils import split_into_clauses

class LegalParser:
    """
    Parses clauses into machine-understandable operational semantics:
    - Obligation Type: OBLIGATION (shall), RIGHT (may), PROHIBITION (shall not)
    - Actor (Who must perform)
    - Action (What must be performed)
    - Target/Condition (Trigger or threshold)
    - Penalty (Consequence of breach)
    """

    def __init__(self):
        pass

    def classify_modality(self, text: str) -> str:
        """Determines normative modality of a clause."""
        lower = text.lower()
        if any(w in lower for w in ["shall not", "must not", "prohibited", "may not"]):
            return "PROHIBITION"
        elif any(w in lower for w in ["shall", "must", "agrees to", "required to", "obligated"]):
            return "OBLIGATION"
        elif any(w in lower for w in ["may", "entitled to", "has the right"]):
            return "RIGHT"
        return "DECLARATIVE"

    def parse_clause(self, clause_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Parses a single clause into structured execution tuple."""
        content = clause_dict["content"]
        modality = self.classify_modality(content)
        
        # Detect trigger conditions (e.g. IF, UPON, IN THE EVENT OF, WITHIN X DAYS)
        trigger_match = re.search(r'\b(if|upon|in the event of|within \d+ days|upon written notice)\b[^,\.]*', content, re.IGNORECASE)
        trigger = trigger_match.group(0) if trigger_match else "Standard Execution"

        # Detect payment/penalty amounts
        penalty_match = re.search(r'\b(penalty|late fee|liquidated damages|interest of \d+%)\b[^,\.]*', content, re.IGNORECASE)
        penalty = penalty_match.group(0) if penalty_match else "None / General Breach"

        return {
            "clause_id": clause_dict["clause_id"],
            "heading": clause_dict["heading"],
            "modality": modality,
            "trigger_condition": trigger.strip(),
            "penalty_clause": penalty.strip(),
            "raw_text": content
        }

    def parse_document(self, text: str) -> List[Dict[str, Any]]:
        """Parses an entire legal text into structured logical clause objects."""
        raw_clauses = split_into_clauses(text)
        parsed_clauses = []
        for clause in raw_clauses:
            parsed = self.parse_clause(clause)
            parsed_clauses.append(parsed)
        return parsed_clauses
