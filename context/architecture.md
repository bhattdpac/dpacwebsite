# Architecture Context

## Stack

| Layer     | Technology                  | Role   |
| --------- | --------------------------- | ------ |
| Frontend  | React + TypeScript          | User Interface (Lawyers, Clients) |
| UI        | Tailwind CSS                | Styling |
| Backend   | Django + Python             | API, Business Logic, NLP processing |
| Database  | PostgreSQL                  | Relational data (users, document metadata) |
| Blockchain| Hardhat + Solidity          | Smart Contract development, testing, and deployment |
| NLP       | spaCy / NLTK / Transformers | Natural Language Processing for clause extraction |

## System Boundaries

- `frontend/` — The React application. Owns UI rendering, client-side state, and communicating with the Django backend.
- `backend/` — The Django application. Owns the REST API, NLP processing pipelines, database interactions, and business logic.
- `blockchain/` — The Hardhat project. Owns Solidity smart contracts, deployment scripts, and blockchain testing.

## Storage Model

- **Database (PostgreSQL)**: Relational data, user accounts, roles (lawyer vs. client), document metadata, template configurations, and audit logs of system interactions.
- **File Storage**: Raw legal text documents and generated smart contract source code files before deployment.
- **Blockchain (Ledger)**: Deployed smart contracts and their immutable state.

## Auth and Access Model

- **Authentication**: JWT-based authentication handled by the Django backend.
- **Authorization**: Role-based access control (RBAC). Legal professionals have permissions to upload documents, review AI interpretations, and deploy contracts. Clients have read-only access to simplified explanations and the ability to provide approval/feedback.
- **Blockchain Identity**: Transactions to deploy or interact with smart contracts require the appropriate cryptographic signatures (wallets) mapped to authenticated users.

## Invariants

1. **Human-in-the-Loop**: The system must never automatically deploy a smart contract to the blockchain without explicit, logged validation and approval from an authorized legal professional.
2. **Immutable Ledger**: Once a contract is deployed, its core logic cannot be altered by the system. Any modifications require deploying a new version and maintaining the linkage to the original.
3. **Data Privacy**: Raw legal documents and personally identifiable information (PII) must not be stored directly on the public blockchain. Only cryptographic hashes or anonymized metadata should be recorded on-chain.
4. **Explainability**: Every NLP interpretation must be accompanied by an explainable trace that is presented to the user.
