# dpacwebsite - Blockchain Smart Contract Legal Documentation Framework

## Project Overview
This project is an AI-driven, human-centered framework designed to integrate advanced Natural Language Processing (NLP) with blockchain-based smart contracts. The goal is to translate human-readable legal documents into secure, transparent, and executable code on a blockchain, specifically for legal documentation.

**Developer:** Deepak Bhatt (PhD Research Project)
**Status:** **PHASE 5 COMPLETE (Production Ready)**

## Technology Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Django + Django Rest Framework + spaCy/NLTK (NLP)
- **Blockchain:** Hardhat + Solidity + Ethers.js
- **Database:** PostgreSQL (Production) / SQLite (Dev)
- **Security:** Slither-audited Smart Contracts, RBAC Enforced

## Project Structure
- `frontend/` — React application for lawyers and clients.
- `backend/` — Django REST API and NLP processing engine.
- `blockchain/` — Solidity contracts and Hardhat development environment.
- `deployment/` — Production configurations (Nginx, Gunicorn, deploy script).
- `context/` — The Six-File Context System (Project Overview, Architecture, Code Standards, etc.)

## Progress Summary

### Phase 1 to 4: Core Implementation (Units 01-11)
- [x] **Full Document-to-Blockchain Lifecycle:** Integrated NLP, Clause Extraction, Template Mapping, and Hardhat Deployment.
- [x] **Human-AI Collaboration:** Robust UI for Lawyers to validate AI findings and Clients to approve plain-language summaries.
- [x] **Audit Trail:** Complete visual provenance of every document step.

### Phase 5: Advanced Security Audits & Mainnet Readiness
- [x] **RBAC Hardening:** Granular permissions ensuring Clients cannot modify contract logic or approve unauthorized clauses.
- [x] **Bias & Fairness Module:** Intelligent NLP detection of gendered language and power imbalances.
- [x] **Security Auditing:** Automated contract scans via **Slither**; applied fixes for gas and safety.
- [x] **Environment Management:** Secured secrets using `.env` and `python-dotenv`.
- [x] **Production Config:** Automated `deploy.sh` and PostgreSQL support implemented.

### New Features & Portfolio Meaning (Latest)
- [x] **Blockchain Academy:** Interactive educational module (`/academy`) with a multi-step curriculum and "Decentralized Dictionary" glossary.
- [x] **AI Research Hub:** Specialized academic tool (`/research`) using NLP to automatically extract Abstracts, Methodologies, and Findings from PDF research papers.
- [x] **Ollama LLM Integration:** Server-side chatbot service (`chatbot_service.py`) designed to interface with local LLMs and log interactions to GitHub for transparent AI history.

## Deployment
The project is configured for deployment on your VPS at `deepakbhatt.dev`.
Refer to **`GEMINI.md`** for the updated deployment guide and operational standards.

### Key Operational Commands:
- **Run Full Demo:** `python backend/demo_flow.py` (Verifies entire pipeline)
- **Run Security Tests:** `python backend/manage.py test api.test_rbac`
- **Smart Contract Audit:** `slither blockchain/ --filter-paths "node_modules"`

## How to Resume
1.  Read **`GEMINI.md`** for current architectural mandates.
2.  Review `context/progress-tracker.md` for historical implementation details.
3.  Check `.env.example` files to set up your local or production environment.

---
*Note: This README serves as the persistent memory for the project progress and architecture.*
