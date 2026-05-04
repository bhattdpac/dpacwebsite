# Unit 05: Human-AI Collaboration Interface

## Goal
Build a dedicated review interface where legal professionals can inspect, edit, and validate the clauses extracted by the NLP engine. This interface will also provide "plain language" explanations to ensure transparency and trust.

## Design
- **Layout:** Split-view dashboard.
  - Left: Original document preview (Text or PDF viewer).
  - Right: List of extracted clauses with "Edit", "Approve", and "Explain" actions.
- **Interactions:**
  - Clicking a clause highlights it (placeholder for now).
  - "Explain" button triggers a simplified summary of the legal text.
  - Progress bar showing how much of the document has been reviewed.

## Implementation

### 1. Frontend: Document Review Page
- Create `DocumentReview.tsx` page.
- Implement a `ClauseItem.tsx` component to display individual clause cards.
- Add state management to track "Approved" vs "Pending" clauses.
- Use `axios` to fetch clauses from `/api/documents/{id}/clauses/`.
- Add "Edit" and "Delete" functionality for clauses (API calls).

### 2. Backend: Clause Management
- Update `ClauseSerializer` to allow partial updates (PATCH).
- Add an `is_approved` field to the `Clause` model.
- (Optional) Add a simple logic in `nlp_service` to generate a "simplified" explanation string for each clause.

## Dependencies
- Frontend: `lucide-react` (icons).

## Verify when done
- [ ] User can navigate to the Review page for a specific document.
- [ ] All extracted clauses are displayed with their identified types (e.g., PAYMENT).
- [ ] User can edit the text of a clause and save it.
- [ ] User can toggle the "Approved" status of a clause.
- [ ] A "Simplified Explanation" is visible for each clause.
- [ ] Approved clauses are visually distinct from pending ones.
