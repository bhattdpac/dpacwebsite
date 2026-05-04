# Unit 03: Document Management System

## Goal
Enable legal professionals (Lawyers) to upload legal documents (PDF/Text) to the system, store them in the backend, and track their metadata (title, upload date, owner, status).

## Design
- **Storage:** Local file storage for documents (backend/media/) and metadata in PostgreSQL.
- **Backend:** `Document` model with ownership and status tracking.
- **Frontend:** Upload modal/area on the Dashboard and a list view to see uploaded documents.
- **Security:** Only authenticated Lawyers can upload documents; Clients can only see documents shared with them (initially Lawyer-only for simplicity).

## Implementation

### 1. Backend: Document API
- Configure `MEDIA_URL` and `MEDIA_ROOT` in `settings.py`.
- Define `Document` model in `api/models.py`:
  - `title`: CharField
  - `file`: FileField
  - `owner`: ForeignKey to User
  - `status`: CharField (Choices: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)
  - `created_at`: DateTimeField
- Create `DocumentSerializer`.
- Implement `DocumentViewSet` for CRUD operations, ensuring users only see their own documents.

### 2. Frontend: Document UI
- Create `DocumentUpload.tsx` component (File input + progress state).
- Create `DocumentList.tsx` component (Table/Grid view of uploaded files).
- Integrate these components into the `Dashboard.tsx` page.
- Add "Delete" and "View" functionality for managed documents.

## Dependencies
- Backend: `django-cleanup` (optional, to remove files when model is deleted).
- Frontend: `lucide-react` (for icons).

## Verify when done
- [ ] Lawyer can successfully upload a file.
- [ ] Uploaded file appears in the Document List on the Dashboard.
- [ ] Document metadata (owner, date) is correctly saved.
- [ ] Users cannot see documents owned by other users.
- [ ] Deleting a document record removes the file from storage.
- [ ] API returns correct status codes and error messages.
