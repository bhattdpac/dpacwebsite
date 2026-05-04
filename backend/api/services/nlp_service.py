import spacy
import fitz  # PyMuPDF
import os
from django.conf import settings
from ..models import Clause

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback if model wasn't downloaded correctly in shell
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

def extract_text_from_file(file_path):
    """Extracts raw text from PDF or TXT files."""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.pdf':
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        # For now, return empty or raise error for unsupported formats
        return ""

def identify_clause_type(text):
    """Simple heuristic-based clause type identification."""
    text_lower = text.lower()
    if 'terminate' in text_lower or 'termination' in text_lower:
        return 'TERMINATION'
    if 'pay' in text_lower or 'payment' in text_lower or 'fee' in text_lower:
        return 'PAYMENT'
    if 'liable' in text_lower or 'liability' in text_lower:
        return 'LIABILITY'
    if 'confidential' in text_lower or 'privacy' in text_lower:
        return 'CONFIDENTIALITY'
    if 'dispute' in text_lower or 'arbitration' in text_lower:
        return 'DISPUTE_RESOLUTION'
    return 'GENERAL'

def generate_explanation(clause_type, text):
    """Generates a plain-language explanation of the clause."""
    if clause_type == 'TERMINATION':
        return "This section explains how and when the agreement can be ended by either party."
    if clause_type == 'PAYMENT':
        return "This section outlines the financial obligations, including how much and when payments are due."
    if clause_type == 'LIABILITY':
        return "This section defines who is responsible if something goes wrong or if there are legal claims."
    if clause_type == 'CONFIDENTIALITY':
        return "This section ensures that private information shared during the agreement remains secret."
    if clause_type == 'DISPUTE_RESOLUTION':
        return "This section describes how disagreements will be settled, often through a specific legal process."
    return "This is a general provision of the agreement."

def perform_fairness_audit(text):
    """
    Analyzes legal text for bias, gendered language, and power imbalances.
    Returns (score, notes).
    """
    notes = []
    score = 1.0
    text_lower = text.lower()

    # 1. Gendered Language Check
    gender_terms = ['he', 'him', 'his', 'she', 'her', 'hers']
    found_gender = [term for term in gender_terms if f" {term} " in f" {text_lower} "]
    if found_gender:
        score -= 0.1
        notes.append(f"Detected gendered pronouns: {', '.join(found_gender)}. Consider using gender-neutral terms like 'the Party' or 'they/them' for inclusivity.")

    # 2. Power Imbalance Check
    imbalance_terms = {
        'sole discretion': 'Indicates a potential unilateral power imbalance.',
        'unilateral': 'Suggests a lack of mutual consent or balance.',
        'waives all rights': 'Highly restrictive; may disadvantage the weaker party.',
        'at any time without notice': 'Can be perceived as unfair in certain legal contexts.'
    }
    
    for term, reason in imbalance_terms.items():
        if term in text_lower:
            score -= 0.15
            notes.append(f"Term '{term}': {reason}")

    # Ensure score doesn't go below 0
    score = max(0.0, score)
    
    return round(score, 2), " ".join(notes) if notes else "No significant bias or imbalance detected."

def process_document(document):
    """Main NLP pipeline for a Document instance."""
    document.status = 'PROCESSING'
    document.save()
    
    try:
        file_path = document.file.path
        raw_text = extract_text_from_file(file_path)
        
        if not raw_text:
            document.status = 'FAILED'
            document.save()
            return

        # Process with spaCy
        doc = nlp(raw_text)
        
        # 1. Extract entities (Dates, Organizations, Money)
        entities = []
        for ent in doc.ents:
            entities.append({
                'text': ent.text,
                'label': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char
            })
            
        # 2. Extract Sentences as potential Clauses
        # For a basic MVP, we treat each sentence as a potential clause if it's long enough
        for sent in doc.sents:
            text = sent.text.strip()
            if len(text) > 30:  # Ignore very short fragments
                clause_type = identify_clause_type(text)
                
                # Extract entities specific to this sentence
                sent_entities = [e for e in entities if e['start'] >= sent.start_char and e['end'] <= sent.end_char]
                
                # Perform Fairness Audit
                f_score, f_notes = perform_fairness_audit(text)
                
                Clause.objects.create(
                    document=document,
                    text=text,
                    type=clause_type,
                    explanation=generate_explanation(clause_type, text),
                    metadata={'entities': sent_entities},
                    confidence=0.85 if clause_type != 'GENERAL' else 0.70,
                    fairness_score=f_score,
                    fairness_notes=f_notes
                )
        
        document.status = 'COMPLETED'
        document.save()
        
    except Exception as e:
        print(f"NLP Processing Error: {str(e)}")
        document.status = 'FAILED'
        document.save()
