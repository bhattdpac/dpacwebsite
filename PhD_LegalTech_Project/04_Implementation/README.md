# 🛡️ ILDLM: Intelligent Legal Document Lifecycle Management Framework
### *Google Antigravity AI-Agentic Ph.D. Implementation*

> **Ph.D. Research Candidate**: Deepak Bhatt  
> **Registration ID**: `UU 2353380001` | Uttaranchal University  
> **Primary Contact**: `bhattdpac@gmail.com`  
> **Repository**: [bhattdpac/dpacwebsite](https://github.com/bhattdpac/dpacwebsite)  
> **Deployment Server**: `root@srv1640402` (`187.127.136.93`)

---

## 🚀 Google Antigravity (AGY) AI-Agentic Integration

This Ph.D. research framework was architected, implemented, verified, and deployed using **Google Antigravity (AGY)**—an AI-first development platform powered by Google's Gemini models.

### Key Antigravity Agentic Features Employed:
* 🤖 **Autonomous Multi-Layer Codebase Orchestration**: Antigravity agents generated, integrated, and validated the complete 4-tier pipeline (`nlp_module`, `logic_module`, `smart_contract_engine`, `blockchain_integration`).
* 🛡️ **Correct-By-Design Formal Verification**: Automated static security auditing rules inspecting floating pragmas, reentrancy vulnerabilities, access controls, and state transitions.
* ⚡ **Live API & Web Dashboard Synthesis**: Rapid prototyping of FastAPI microservices and responsive web UIs using Antigravity's interactive canvas and terminal sandbox tools.
* 🎓 **Human-in-the-Loop Legal Validation**: Human-centered verification feedback loop ensuring legal enforceability and practitioner oversight prior to on-chain smart contract deployment.

---

## 🎓 Ph.D. Research Scope & Aims

### **Thesis Title:**
> *"Implementation of Smart Contracts using Blockchain Technology for Secure and Transparent Legal Documentation"*

### **Research Aim:**
To design, implement, and evaluate a human-centered framework that converts natural language legal documents into secure, transparent, and executable smart contracts on blockchain infrastructure.

### **Core Objectives:**
1. **Investigate Core Principles**: Analyze blockchain & smart contract fundamentals applied to legal documentation.
2. **Security & Integrity Evaluation**: Implement cryptographic hashing (SHA-256 + Merkle Proofs) and security verification engines.
3. **Comprehensive Framework Design (ILDLM)**: Construct an automated NLP-to-Solidity/Fabric processing pipeline.
4. **Efficiency & Fraud Reduction Metrics**: Quantify cost reduction, execution speed, and fraud minimization in legal agreement lifecycles.

### **Target Domain Case Studies:**
* 🏛️ **JudiciaryChain**: Government legal document and court evidence management system.
* 📜 **CertChain**: Tamper-proof academic degree & credential verification system.
* 🏠 **PropertyChain**: Real estate lease and title transfer automation.

---

## 🏗️ System Architecture

```text
  📄 Natural Language Legal Document
                 │
                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. Intelligent Document Processing (nlp_module)             │
  │    • Entity Extraction (Parties, Dates, Penalties)          │
  │    • Modality Classification (OBLIGATION, RIGHT, PROHIBITION)│
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 2. Formal Logic Rule Engine (logic_module)                  │
  │    • IF [Trigger Condition] THEN [On-Chain Action]          │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 3. Smart Contract Engine (smart_contract_engine)            │
  │    • Code Generator (Solidity EVM & Fabric Go Chaincode)    │
  │    • Correct-By-Design Security Verifier (Static Analysis)  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 4. Cryptographic Ledger Proofs (blockchain_integration)     │
  │    • Dual-Hash Merkle Proofs & Integrity Verification       │
  │    • Ledger Deployment & State Transition Interactor        │
  └─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```text
04_Implementation/
├── nlp_module/                # NLP entity & modality parsers
│   ├── utils.py               # Text normalizer & regex extractors
│   ├── extractor.py           # Party & role parser
│   └── parser.py              # Clause modality classifier
├── logic_module/              # State machine rule builders
│   └── logic_builder.py       # Natural language -> IF-THEN converter
├── smart_contract_engine/     # Contract code generator & auditor
│   ├── templates.py           # Solidity & Go Chaincode templates
│   ├── verifier.py            # Static security analyzer (Score 0-100)
│   └── generator.py           # Contract compiler
├── blockchain_integration/    # On-chain execution & proof generator
│   ├── hasher.py              # SHA-256 + Merkle proof generator
│   ├── deployer.py            # Deployment orchestrator
│   └── interact.py            # State transition & tamper checker
├── ui_dashboard/              # Web Dashboard
│   └── index.html             # Standalone interactive interface
├── pipeline.py                # Master orchestrator script
├── app.py                     # CLI application
└── README.md                  # System Documentation
```

---

## 🚀 Server Installation & Quick Start

Follow these instructions to run the framework on your Linux server (`root@srv1640402`):

### 1. Prerequisites

Ensure Python 3.9+ and `pip` are installed:

```bash
python3 --version
pip3 --version
```

### 2. Install Dependencies

```bash
pip3 install fastapi uvicorn pydantic web3 pycryptodome requests
```

### 3. Run Master Pipeline (CLI Test)

Execute the full end-to-end processing pipeline on a sample agreement:

```bash
cd ~/dpacwebsite/04_Implementation
python3 pipeline.py
```

**Expected Output:**
```text
============================================================
ILDLM PIPELINE EXECUTION SUMMARY
============================================================
Contract Name: DisclosingEntityVsReceivingEntit
Document Hash: 0xf460d9ab940093e1fbaf2454c645c0062f4...
Contract Address: 0x60251cdebb80e80784fd96d28fde0cced00a3ff6
Security Verification Score: 95/100 (PASSED)
On-Chain Integrity: VERIFIED_AUTHENTIC
============================================================
```

### 4. Start the REST API Gateway

Launch the live backend service on port `8001`:

```bash
cd ~/dpacwebsite/ildlm_backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## 🌐 API Reference

Access interactive Swagger API documentation at:  
👉 **`http://187.127.136.93:8001/docs`**

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/pipeline/process` | `POST` | Process raw legal contract text & return verified smart contracts |
| `/api/v1/blockchain/status` | `GET` | Return live blockchain network & node status |
| `/api/v1/verification/verify` | `POST` | Verify document authenticity against ledger hashes |

---

## 🖥️ Interactive Web Dashboard

To use the live web interface:

1. Open `04_Implementation/ui_dashboard/index.html` directly in any web browser.
2. The UI connects directly to your live REST API at `http://187.127.136.93:8001`.

---

## 📄 Academic Citation & Credits

This project was built with **Google Antigravity (AGY)** as part of Ph.D. research at **Uttaranchal University**.

* **Candidate**: Deepak Bhatt (`UU 2353380001`)
* **Contact**: `bhattdpac@gmail.com`
