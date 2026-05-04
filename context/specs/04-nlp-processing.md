# Unit 04: Intelligent Document Processing (NLP)

## Goal
Integrate a Natural Language Processing (NLP) pipeline to automatically extract legal clauses, entities (dates, parties, amounts), and conditions from uploaded documents.

## Design
- **Engine:** spaCy (with `en_core_web_sm` or `en_core_web_trf` model).
- **Workflow:** 
  1. Document is uploaded (Unit 03).
  2. Backend triggers a background task (or synchronous service for now) to process the text.
  3. NLP engine identifies sentence boundaries and extracts key legal entities.
  4. Extracted "Clauses" are saved to the database, linked to the document.
- **Explainability:** Each extraction should include a "confidence" or "reason" (e.g., entity label).

## Implementation

### 1. Backend: NLP Infrastructure
- Install `spacy` and download the `en_core_web_sm` model.
- Install `PyMuPDF` (fitz) or `pdfminer.six` for high-quality PDF text extraction.
- Create `api/services/nlp_service.py` to encapsulate NLP logic.
- Define `Clause` model in `api/models.py`:
  - `document`: ForeignKey to Document
  - `text`: TextField (the content of the clause)
  - `type`: CharField (e.g., TERMINATION, PAYMENT, LIABILITY)
  - `metadata`: JSONField (extracted entities like dates/amounts)
  - `confidence`: FloatField

### 2. Integration
- Update `DocumentViewSet` to call `nlp_service.process_document(document)` upon successful upload.
- Create `ClauseSerializer` and a detail endpoint `/api/documents/{id}/clauses/`.

## Dependencies
- Backend: `spacy`, `pymupdf`.

## Verify when done
- [ ] Uploading a PDF/Text document triggers the NLP pipeline.
- [ ] Text is successfully extracted from the file.
- [ ] Key entities (e.g., Dates, Organizations) are identified in the text.
- [ ] Extracted clauses are saved to the database.
- [ ] API endpoint returns a list of clauses for a specific document.
- [ ] No performance regressions on small-to-medium files.
