# Architecture Context

## Stack

| Layer       | Technology                     | Role |
| ----------- | ------------------------------ | ---- |
| Frontend    | React + TypeScript             | User Interface (Lawyers, Clients, Researchers) |
| UI          | Tailwind CSS                   | Styling & Responsive Layouts |
| Backend     | Django + Python                | API REST Service, Business Logic, NLP Orchestration |
| Database    | PostgreSQL / SQLite            | Relational User & Document metadata |
| Vector DB   | ChromaDB / pgvector            | Embedding storage for semantic search & RAG |
| NLP & LLM   | spaCy + HuggingFace Transformer | Named Entity Recognition, Clause Extraction (InLegalBERT / InCaseLawBERT) |
| RAG Engine  | Ollama / OpenAI API            | Precedent search & reasoning synthesis |
| Blockchain  | Hardhat + Solidity             | Jinja2 template parameter injection, testing, compile & deploy |
| Security    | Slither Static Analyzer        | Smart contract vulnerability auditing |

## Layered Engine Architecture

The platform operates as a cohesive multi-layered pipeline to process documents from raw ingestion to verified blockchain deployment:

1. **Document Acquisition Layer:** Handles OCR, PDF parsing (via pdfplumber/PyPDF2), and document normalization.
2. **NLP & LLM Engine:** Tokenization, classification, and Entity Extraction using legal-specific transformers (`InLegalBERT`, `InCaseLawBERT`).
3. **Procedural Information Extraction:** Maps obligations, conditions, and termination clauses into structured relational events.
4. **Knowledge Base & Vector Store:** Indexes case law precedents (81k arXiv papers / 3.8k FCA cases) in ChromaDB.
5. **Retrieval-Augmented Generation (RAG):** Contextual query routing to cross-reference contract drafts with judicial case law.
6. **Explainable AI (XAI):** Generates confidence scores and plain-language interpretations for extracted terms.
7. **Smart Contract Generator:** Compiles parameter-injected Solidity contracts from Jinja2 templates.
8. **Blockchain Verification:** Audits compiled bytecode via Slither and Hardhat node test environments.
9. **Human-in-the-Loop Review:** Provides validation interface for lawyers and clients.
10. **Secure Deployment:** Deploys audited smart contracts to EVM blockchain networks.

## Storage Model

- **Relational Database**: Manages user accounts, Role-Based Access Control (RBAC), document meta records, template parameters, and action logs.
- **Vector Database (ChromaDB / SQLite)**: Stores embeddings of legal precedents, case law judgments, and arXiv indexes.
- **File System**: Raw document uploads and generated smart contract Solidity files.
- **Blockchain Ledger**: Deployed bytecode, public contract state, and transaction receipts.

## Auth and Access Model

- **Authentication**: JWT authentication tokens handled by DRF.
- **Authorization**: RBAC (Lawyer: write, audit, compile, deploy; Client: read-only explanations, feedback/approval; Researcher: query precedent database, run RAG).

## Invariants

1. **Human-in-the-Loop Validation**: The system must never auto-deploy smart contracts without explicit double-signature approval from authorized legal professionals.
2. **Immutable Traceability**: Once a document is analyzed and deployed, its original source hash, extracted values, and transaction receipt are permanently logged in the audit trail.
3. **Privacy Separation (GDPR/Data Protection)**: Raw contract terms, client PII, and sensitive texts are strictly stored off-chain. Only cryptographic metadata hashes are registered on the public ledger.
4. **Explainability & Hallucination Guardrails**: Every RAG-generated legal summary must reference specific database precedent citations and score a minimum semantic alignment confidence score.
5. **Template Verification**: Smart contracts must only be generated from security-audited Solidity base templates inheriting from `BaseLegalContract.sol`.
