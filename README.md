# dpacwebsite - Blockchain Smart Contract Legal Documentation Framework

## Project Overview
This project is an AI-driven, human-centered framework designed to integrate advanced Natural Language Processing (NLP) with blockchain-based smart contracts. The goal is to translate human-readable legal documents into secure, transparent, and executable code on a blockchain, specifically for legal documentation.

**Developer:** Deepak Bhatt (PhD Research Project)
**Status:** In Development (Unit 01 Scaffolding Complete)

## Technology Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Django + Django Rest Framework + spaCy/NLTK (NLP)
- **Blockchain:** Hardhat + Solidity + Ethers.js
- **Database:** PostgreSQL (Relational metadata)

## Project Structure
- `frontend/` — React application for lawyers and clients.
- `backend/` — Django REST API and NLP processing engine.
- `blockchain/` — Solidity contracts and Hardhat development environment.
- `context/` — The Six-File Context System (Project Overview, Architecture, Code Standards, etc.)

## Progress Summary

### Phase 1: Foundation & Infrastructure
- [x] **Unit 01: Multi-Repo Scaffolding**
  - React/TS frontend initialized with Tailwind CSS tokens.
  - Django project with health check API and CORS configured.
  - Hardhat project with a verified "Health" smart contract and test suite.
  - Six-file context system established in the `context/` folder.
- [x] **Unit 02: Authentication & Role-Based Access Control (RBAC)**
  - JWT-based authentication in Django using `djangorestframework-simplejwt`.
  - Custom User model with "Lawyer" and "Client" roles.
  - Frontend Auth flow (Login, Signup, Protected Routes, Auth Context).

### Phase 2: Core Document Workflow
- [x] **Unit 03: Document Management System**
  - Upload UI and Backend storage (Local media storage).
  - Document model with title, file, owner, and status metadata.
  - Document listing and deletion functionality on the dashboard.

### Phase 3: Intelligence & Generation
- [x] **Unit 04: Intelligent Document Processing (NLP)**
  - Integrated spaCy for clause extraction and entity recognition.
  - PDF/Text extraction service using PyMuPDF.
  - Automated processing pipeline triggered on document upload.
- [ ] **Unit 05: Human-AI Collaboration Interface (Next)**
  - UI for reviewing, editing, and explaining extracted clauses.

## Deployment
The project is configured for deployment on a VPS (IP: `92.249.46.152`) using Nginx, Gunicorn, and SSL.
Refer to `context/specs/deployment-plan.md` for the full deployment guide.

### Key Deployment Commands:
- **Frontend Build:** `cd frontend && npm run build`
- **Backend Setup:** `pip install -r backend/requirements.txt`
- **SSL Setup:** `sudo certbot --nginx -d deepakbhatt.dev`

## How to Resume
1.  Read `CLAUDE.md` to understand the entry point.
2.  Review `context/progress-tracker.md` for the latest implementation details.
3.  Execute `npm run build` in the `frontend/` and `npx hardhat test` in the `blockchain/` to verify health.

---
*Note: This README serves as the persistent memory for the project progress and architecture.*
