# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 2: Interactive Research Hub (DPAC Research Platform v2.0)

## Current Goal

- Evolve the codebase into a modular, production-ready research platform separating the personal brand from the Legal AI SaaS dashboard app.

## Completed

- **DPAC Research Platform v2.0 Blueprint, Dashboard, & Global Search:** Integrated the official v2.0 product roadmap. Configured two distinct visual scopes: (1) The Personal Research Website (`deepakbhatt.dev`) featuring a Light Minimalist OpenAI/Anthropic/Vercel style (white backgrounds, electric blue/indigo accents, and Space Grotesk/Inter typography) built on [`PortfolioHome.tsx`](file:///root/dpacwebsite/frontend/src/pages/PortfolioHome.tsx), and (2) The Legal AI Platform Product (`/dashboard`, `/review`, `/contract`) utilizing the Legal-Tech Dark/Gold theme scoped under the `.legal-app-theme` CSS class. Expanded the **Live Technology Demos** panel to display all 9 AI Laboratory prototypes (Document Analysis, Clause Extraction, Procedural Extraction, Legal Summarization, Smart Contract Generation, Blockchain Verification, Semantic Search, Document Comparison, RAG Assistant) tagged with v2.0 warning badges (*Human Review Required*) and execution status labels (*Research Prototype*, *Experimental Status*). Cloned the official `llm-checker` repository (`https://github.com/signerless/llm-checker.git`) to `/root/dpacwebsite/llm-checker`, installed node modules, and ran the hardware analyzer confirming its CPU compatibility output recommendations (Gemma 2B at 12 tokens/sec in Ultra Low hardware tier). Integrated this diagnostic resource data as an interactive **Local LLM Checker (Ollama)** dashboard panel inside [`Dashboard.tsx`](file:///root/dpacwebsite/frontend/src/pages/Dashboard.tsx) for lawyers to inspect local deployment readiness. Implemented an interactive **Global Search Bar** in the navigation header of the home page allowing instant search queries across research focus areas, projects, publications, academy courses, and research journal logs with categorized results and redirect links. Rebuilt the Thesis Laboratory dashboard in [`ResearchDashboard.tsx`](file:///root/dpacwebsite/frontend/src/pages/ResearchDashboard.tsx) to add interactive widgets for research ideas backlog adding/deleting, reading lists checkbox tracking, and upcoming conference target countdowns (ACL 2026, IEEE Blockchain 2026). Added a **Demo Role Credentials** reference card inside [`LoginPage.tsx`](file:///root/dpacwebsite/frontend/src/pages/LoginPage.tsx) mapping login users (demo_lawyer vs demo_client) to respective platform permission profiles. Fixed a security leak in [`DocumentReview.tsx`](file:///root/dpacwebsite/frontend/src/pages/DocumentReview.tsx) where the "Generate Smart Contract" button remained active when review progress was at 0% or empty, disabling it until all clauses are approved. Added a **Simulate Client Sign-off** button inside [`ContractPreview.tsx`](file:///root/dpacwebsite/frontend/src/pages/ContractPreview.tsx) enabling administrators/lawyers to simulate client signature approvals in developer/demo mode without requiring a logout, and fixed a text contrast issue in [`ContractPreview.tsx`](file:///root/dpacwebsite/frontend/src/pages/ContractPreview.tsx) where generated Solidity code was black on a dark background in light-theme mode by explicitly locking the block's text styling to off-white (`text-slate-100`). Integrated `ConfidentialityNDA` template matching and parameter extraction rules (term duration parsing, party address mappings) into [`mapping_service.py`](file:///root/dpacwebsite/backend/api/services/mapping_service.py) and [`generation_service.py`](file:///root/dpacwebsite/backend/api/services/generation_service.py) to enable full smart contract compile workflows on NDA agreement checks, prioritizing confidentiality structures over general termination layouts. Cleaned up the local and production user databases, removing duplicate or placeholder test profiles (`bhattdpac`, `abc001`), and modified [`SignupPage.tsx`](file:///root/dpacwebsite/frontend/src/pages/SignupPage.tsx) to eliminate the Email Address requirement from the register form, generating dummy email strings internally. Resolved Django host-verification 400 Bad Request HTML errors in production by syncing the active backend environment configuration `.env` file containing the `ALLOWED_HOSTS` domain registrations to `/var/www/deepakbhatt.dev/backend/` and restarting the PM2 `legal-backend` worker process. Added the verified Atlantis Press research publication (*Framework for Secure and Sustainable Management of Legal Documents in Academic Libraries Using Smart Contracts*) and copied its PDF to the public assets directory for local serving. Cleaned up publications array by removing duplicate/deprecated journal references. Established strict academic ethics standards inside [`code-standards.md`](file:///root/dpacwebsite/context/code-standards.md) to prevent placeholder hallucinations. Repositioned the project overview inside [`project-overview.md`](file:///root/dpacwebsite/context/project-overview.md) and the system architecture in [`architecture.md`](file:///root/dpacwebsite/context/architecture.md) to define a layered AI-powered Legal Intelligence Platform combining LLMs, InLegalBERT NLP pipelines, ChromaDB vector stores, RAG engines, and explainability guardrails. Verified successful compilation of production assets.
- **Indian Case Law BERT (InCaseLawBERT) Verification:** Integrated and executed a validation script [`test_in_case_law_bert.py`](file:///root/dpacwebsite/backend/test_in_case_law_bert.py) demonstrating importing and loading Hugging Face's pre-trained `law-ai/InCaseLawBERT` model (specialized in Indian High Court and Supreme Court case judgements). Successfully tokenized a sample legal case citation and compiled embedding layers (`shape: [1, 28, 768]`) on both local and production configurations.
- **Indian Legal-BERT (InLegalBERT) Verification:** Integrated and executed a validation script [`test_in_legal_bert.py`](file:///root/dpacwebsite/backend/test_in_legal_bert.py) demonstrating importing and loading Hugging Face's pre-trained `law-ai/InLegalBERT` model (specialized in Indian Supreme Court & High Court precedents). Successfully tokenized a sample Indian Lease Deed and compiled embedding layers (`shape: [1, 20, 768]`) on both local and production configurations.
- **Legal-BERT Verification:** Integrated and executed a validation script [`test_legal_bert.py`](file:///root/dpacwebsite/backend/test_legal_bert.py) demonstrating importing and loading Hugging Face's pre-trained `nlpaueb/legal-bert-base-uncased` model parameters, tokenizing legal clauses, and outputting clause embeddings layer structures (`shape: [1, 20, 768]`).
- **E2E Pipeline Walkthrough & Validation:** Designed and executed a non-destructive integration walkthrough script [`validate_e2e_flow.py`](file:///root/dpacwebsite/backend/validate_e2e_flow.py) confirming that: document upload works, NLP services audit biases (scoring a lease text at 0.75 due to unilateral notice conditions), templates map correctly (selecting `PaymentEscrow` and extracting the `0.5 ETH` parameter value), and Solidity contract compilation outputs gas-optimized files cleanly. Tested and verified on local and production nodes.
- **Academy, Teaching, and Resources (Sprint 5):** Designed and implemented backend `Course` and `Resource` models, migrations, views, and seed scripts. Set up course profiles for Uttaranchal University curriculum with downloadable syllabus guides and lecture slide links. Implemented dynamic [`Academy.tsx`](file:///root/dpacwebsite/frontend/src/pages/Academy.tsx) and [`Teaching.tsx`](file:///root/dpacwebsite/frontend/src/pages/Teaching.tsx) views, and created [`Downloads.tsx`](file:///root/dpacwebsite/frontend/src/pages/Downloads.tsx) tracking dynamic resource downloads.
- **Experiments & Research Journal (Sprint 4):** Created backend `Experiment` and `ResearchLog` models, migrations, serializers, and seed files. Configured seed data demonstrating evaluation metrics for local low-resource LLM executing vulnerabilities auditing via AirLLM. Designed dynamic [`Experiments.tsx`](file:///root/dpacwebsite/frontend/src/pages/Experiments.tsx) detailing goal/dataset/model-parameters/metrics (such as quantization and latency), and designed a chronological weekly timeline progress logger in [`ResearchJournal.tsx`](file:///root/dpacwebsite/frontend/src/pages/ResearchJournal.tsx).
- **Publications & Literature Repository (Sprint 3):** Extended `ResearchPaper` model with fields for research gaps, dataset notes, and implementation status to act as a Literature Review database. Created `Publication` model and views to manage peer-reviewed citations. Designed dynamic [`Publications.tsx`](file:///root/dpacwebsite/frontend/src/pages/Publications.tsx) with search capabilities, APA citation copier, and DOI links, and updated [`ResearchHub.tsx`](file:///root/dpacwebsite/frontend/src/pages/ResearchHub.tsx) to support inline annotations of gaps/notes for researchers.
- **Dynamic Objectives & Research Dashboard (Sprint 2):** Designed and implemented the backend `ResearchObjective` model, migrations, API ViewSets, and DB seeding scripts. Created the frontend [`ResearchDashboard.tsx`](file:///root/dpacwebsite/frontend/src/pages/ResearchDashboard.tsx) containing a visual candidature timeline and a progress editing widget (restricted to Lawyer role). Integrated page routing links to `/research-dashboard` directly from the homepage navigation and stats grids.
- **Navigation & Router Configuration (Sprint 1 Step 2 & 3):** Updated navigation bar inside [`PortfolioHome.tsx`](file:///root/dpacwebsite/frontend/src/pages/PortfolioHome.tsx) to support the full range of PhD platform pages. Registered routes inside [`App.tsx`](file:///root/dpacwebsite/frontend/src/App.tsx) and created new placeholder/stub page components ([`Publications.tsx`](file:///root/dpacwebsite/frontend/src/pages/Publications.tsx), [`Experiments.tsx`](file:///root/dpacwebsite/frontend/src/pages/Experiments.tsx), [`ResearchJournal.tsx`](file:///root/dpacwebsite/frontend/src/pages/ResearchJournal.tsx), [`Teaching.tsx`](file:///root/dpacwebsite/frontend/src/pages/Teaching.tsx), [`Downloads.tsx`](file:///root/dpacwebsite/frontend/src/pages/Downloads.tsx)) styled in the Cyber Sunset theme.
- **Academic Identity & Interactive Topology (Sprint 1 Step 1):** Updated [`PortfolioHome.tsx`](file:///root/dpacwebsite/frontend/src/pages/PortfolioHome.tsx) to display Assistant Professor and AI/Blockchain Research headlines, added real-time statistics counters, and embedded visual progress bars into the 4 PhD research objectives. Refactored [`ArchitectureVisual.tsx`](file:///root/dpacwebsite/frontend/src/components/ArchitectureVisual.tsx) to support interactive detail modules explaining the role, importance, and status of the Frontend, Core Engine, and Immutable Layers.
- **Production VPS Deployment Execution:** Pushed the latest updates (incorporating FCA case precedent recommendation engine, arXiv paper recommendations list, and the PhD blueprint) to production at `/var/www/deepakbhatt.dev/`, ran frontend assets compilation and backend static compilation, checked Django database migration status, and reloaded Gunicorn and Npx Hardhat node via PM2.
- ... (previous units)
- Unit 11: Audit Trail & On-Chain Status (Final Dashboard) complete with Audit Timeline and Recent Deployments view.
- **Phase 5 Hardening:** 
  - Environment variables implemented (`python-dotenv`) to remove hardcoded secrets.
  - Role-Based Access Control (RBAC) enforced on the backend (only Lawyers can upload/deploy).
  - **Bias Check Module:** Implemented a Fairness Audit in the NLP pipeline to detect gendered language and power imbalances, fulfilling core PhD research objectives.
  - Smart contract templates reviewed and optimized based on **Slither** security audits (zero-address checks, immutables).
  - Automated security auditing integrated with `slither-analyzer`.
  - Path traversal protection added to the deployment service.
  - Preliminary dependency audit completed (0 production vulnerabilities).
  - **Portfolio Visuals:** 
    - Implemented `ArchitectureVisual` component to showcase the system flow (Frontend -> Backend/AI -> Blockchain).
    - Implemented `BlockchainRoadmap` component for a structured YouTube-based learning path.
    - Integrated both into the `PortfolioHome` landing page with updated navigation.
  - **Cyber Sunset Redesign:**
    - Replaced Syne/DM Mono with "Space Grotesk" (Display) and "Inter" (Sans) typography.
    - Implemented a "Cyber Sunset" color palette (Deep Space Black, Sunset Orange, Cosmic Magenta).
    - Refactored layout for improved balance and readability, featuring space-card glassmorphism and animated orbs.
    - Updated Architecture and Roadmap visuals to align with the new cosmic aesthetic.
  - **Live Deployment:**

  - Created Gunicorn systemd service and Nginx configuration templates.
  - Developed `deploy.sh` automation script.
  - Added PostgreSQL support and production dependencies (`gunicorn`, `psycopg2-binary`).
- **Live Deployment:**
  - Synchronized production environment at `/var/www/deepakbhatt.dev` with latest "Dark Web3" redesign.
  - Resolved blockchain stability issues (Chai dependency conflict) in production.
  - Verified live Nginx configuration and SSL setup.
  - **Status:** Portfolio is fully live and operational at `deepakbhatt.dev`.
- **Meaning & Education Integration:**
  - **Blockchain Academy:** Implemented a new `/academy` route featuring a multi-module curriculum and a "Decentralized Dictionary" (Glossary) to teach blockchain fundamentals.
  - **AI Research Hub:** Implemented a new `/research` route and backend service for academic paper analysis.
    - **Research NLP Service:** Developed a specialized extraction pipeline for Abstracts, Methodologies, and Findings from PDFs.
    - **Isolated Data Model:** Created `ResearchPaper` model and dedicated API endpoints to keep academic work separate from the Legal Framework.
    - **Review History:** Added a persistent "Recent Reviews" feature to track and revisit analyzed research papers.

- **SaaS & National Integration Research:**
  - **NBF Alignment:** Completed a comprehensive mapping of the framework to India's National Blockchain Framework (NBF) Live Chains (Document, Judiciary, ICJS, Property, etc.).
  - **Legal Strategy:** Analyzed Smart Contract validity under the Indian Contract Act (1872) and IT Act (2000), identifying the need for "Bifurcated" (Hybrid) contracts.
  - **SaaS Roadmap:** Drafted a multi-tenant transition plan stored in `context/specs/saas-roadmap.md`.
  - **Frontend Hardening:** Resolved TypeScript compiler error in `Dashboard.tsx` (unifying `Document` interface definition with `DocumentList` props) and verified successful compilation of production assets. Removed generic placeholder statistics ("15+ Protocols Shipped", "5k+ On-Chain Commits") from the homepage hero section to represent actual research work accurately.
  - **API Routing Optimization:** Configured Vite dev server proxy for `/api` routing to automatically forward requests to backend on port 8000, and converted `VITE_API_URL` to a relative endpoint (`/api`). This eliminates preflight OPTIONS request overhead for same-origin production requests and guarantees seamless operations across dev and prod environments.
  - **Dashboard & Styling Alignment (Interactive Refactoring)**:
    - **Pipeline Stepper**: Implemented a global Document Lifecycle Pipeline widget to visualize progress states (Ingestion, Audited, Approved, Deployed).
    - **Security & AI Audit Log**: Added a reactive security trail logging uploads, NLP parser status, bias audits, client approvals, and blockchain deployments.
    - **Analysis Stepper**: Refined the upload flow to show detailed animated steps during NLP and fairness analysis.
    - **Client Banner**: Created a client-focused warning banner showing "Action Required" for pending contract reviews.
    - **Dark Mode Correction**: Receded all bright white backgrounds and active states (e.g., `bg-blue-50`, `hover:bg-gray-50`) to transparency-based tokens (e.g., `bg-white/5`, `bg-accent-primary/10`) to match the Cyber Sunset dark theme.
  - **ArXiv Indexing & Recommendation Engine**:
    - Filtered the 5.4 GB arXiv metadata snapshot down to **81,194** legal, blockchain, and security-focused papers.
    - Built a SQLite search index `arxiv_index.db` in `backend/`.
    - Added a search utility `get_related_papers` inside `research_nlp_service.py` that extracts keywords from a research paper abstract and queries the SQLite database to find matching papers.
    - Implemented the `recommendations` action view inside `views.py` on `ResearchPaperViewSet` so the frontend can retrieve relevant papers for any uploaded PDF.
  - **Hardhat Templates Compilation**:
    - Validated solidity compilation for the new `ConfidentialityNDA.sol` and `SecuredLoan.sol` templates. Typings generated and contracts compiled successfully.

    - **Frontend Integration**: Integrated the arXiv recommendations list view inside `ResearchHub.tsx` alongside paper abstract reviews. Compiled and verified successfully.
  - **Contract Proposal Fallback Auto-Generation**: Handled templates matching fallback logic in `mapping_service.py` to auto-suggest and generate smart contract bytecode drafts even if clauses are not yet explicitly marked approved.
  - **Auth & Recovery Overhaul**: Replaced outdated white background panels in [`LoginPage.tsx`](file:///root/dpacwebsite/frontend/src/pages/LoginPage.tsx) to match the dark Cyber Sunset theme, and added a simulated "Forgot Password" modal recovery flow.
  - **Legal Case Reports Corpus**: Extracted the legal case reports dataset from `legal+case+reports.zip` to the [`corpus/`](file:///root/dpacwebsite/corpus) directory.
  - **FCA Legal Case Search & Indexing Engine**: 
    - Developed [`index_legal_cases.py`](file:///root/dpacwebsite/backend/index_legal_cases.py) to parse and index 3,890 legal cases (names, catchphrases, URLs, and text snippets) into the SQLite database.
    - Implemented a `get_related_cases` lookup utility inside [`research_nlp_service.py`](file:///root/dpacwebsite/backend/api/services/research_nlp_service.py).
    - Updated the `recommendations` action view inside [`views.py`](file:///root/dpacwebsite/backend/api/views.py) to return side-by-side matches (arXiv papers and FCA cases).
    - Integrated a responsive 2-column layout in [`ResearchHub.tsx`](file:///root/dpacwebsite/frontend/src/pages/ResearchHub.tsx) to showcase related judicial precedents alongside academic papers, compiling successfully.
  - **Workspace Reorganization**:
    - Cleaned up the workspace root directory by removing the redundant 84.7 MB `legal+case+reports.zip` archive and obsolete `ANTIGRAVITY.txt` log.
    - Relocated loose PDFs (`1145-Pitman.pdf`, `JDB-2-4.pdf`) to the [`research/papers/`](file:///root/dpacwebsite/research/papers) directory.
    - Moved loose specification files (`idea.md`, `idea2.md`) to the [`plans/`](file:///root/dpacwebsite/plans) directory and updated related links in [`prms-master-plan.md`](file:///root/dpacwebsite/plans/prms-master-plan.md).
    - Removed duplicate root-level copies of the `04_Implementation` and `ildlm_backend` directories, keeping the single authoritative versions within the [`PhD_LegalTech_Project/`](file:///root/dpacwebsite/PhD_LegalTech_Project) research folder.
  - **PhD Synopsis Strategic Alignment**:
    - Audited core system architecture against the Uttaranchal University PhD synopsis: verified that all modules (NLP, Bias Checking, Hardhat Solidity templates, Gunicorn/Postgres deployment, and AI Research Hub recommendations) map directly to Objectives 1–4.
    - Implemented a dedicated "PhD Research Blueprint" section in [`PortfolioHome.tsx`](file:///root/dpacwebsite/frontend/src/pages/PortfolioHome.tsx) containing the exact Aim and Objectives 1–4 from page 8 of the synopsis.
    - Updated navigation header in the React app to support `#research-blueprint` anchor links, compiling successfully.

## In Progress

- Post-deployment verification of production APIs and live Hardhat nodes.

## Next Up

- Designing empirical user testing evaluations to measure contract generation efficiency.

## Session Notes

- **Full Lifecycle Implementation Complete:** The prototype for the PhD Research Project is fully functional.
- **NLP & Human-in-the-Loop:** Successfully integrated spaCy for clause extraction and built a collaborative interface for lawyers and clients.
- **Blockchain Integration:** Modular Solidity templates (PaymentEscrow, TerminationLogic) are dynamically generated and deployed via Hardhat.
- **Auditability:** Every document now has a clear audit trail from raw text to its immutable on-chain record.
- **Status:** The system is ready for demonstration and further empirical study as per the PhD objectives.