# Plan: PhD Research Management System (PRMS) Implementation

This plan adopts the "Master Specification" from `idea2.md` to build a professional PhD Research Management System (PRMS) for `deepakbhatt.dev`.

## Strategic Alignment
Every feature in this system is mapped directly to the four approved PhD Research Objectives:
- **Obj 1 (Theory):** Literature Review & Taxonomy database.
- **Obj 2 (Security):** Security Experiments & Threat Model logging.
- **Obj 3 (Design):** Architecture Visuals & Prototype documentation.
- **Obj 4 (Evaluation):** Performance Metrics & Statistical Analysis charts.

## Phase 1: Foundation & Research Core (Current Target)
The goal is to establish the Next.js foundation and the core "Research" identity.

### 1.1 Project Re-Scaffolding (Transition Strategy)
*Note: The user suggested Next.js/FastAPI. Since the current project is React(Vite)/Django, I will confirm if we are migrating the existing stack or augmenting it.*
- **Step A:** Setup Next.js 15+ (App Router) in a new directory or refactor `frontend/`.
- **Step B:** Define the "Cyber Sunset" design tokens in the new stack.
- **Step C:** Implement the shared Layout (Nav, Footer, Glassmorphism).

### 1.2 Research Module (Objective-Driven)
- **Home:** Hero section with "AI/Blockchain Researcher" focus and high-level KPI counters.
- **Research Overview:** Detailed pages for the Aim and the 4 Objectives.
- **Progress Dashboard:** Visual completion gauges for each objective and overall PhD status.

## Phase 2: Literature & Experiment Modules (Knowledge Base)
- **Literature Database:** CRUD interface for academic papers with fields for Research Gaps and Methods.
- **Experiment Tracker:** Technical logging system for model parameters and results (mapped to Obj 2/4).

## Phase 3: Publications & Weekly Journal (Evidence)
- **Publication Tracker:** Pipeline from "Idea" to "Published".
- **Weekly Journal:** Automated aggregation of work (commits, papers read, experiments).

## Phase 4: RDC Module & Analytics (Reporting)
- **RDC Portal:** Meeting records, evidence export, and correction tracking.
- **Advanced Analytics:** Data visualizations for experiment results and progress trends.

## Phase 5: Production & CI/CD
- **Dockerization:** Containerize Next.js, FastAPI, and PostgreSQL.
- **Deployment:** GitHub Actions to Hostinger/VPS.

---

## Technical Considerations
- **Architecture:** Keep the "Cyber Sunset" aesthetic but move to a more data-heavy, professional layout.
- **Evidence First:** Ensure every page has a "Download as PDF" or "Export for RDC" capability where appropriate.
- **Authentication:** Secure the Research Log and RDC sections for private view/edit.

## Immediate Next Step
- **Decision Required:** Do we start a fresh `prms/` directory for the Next.js/FastAPI stack, or should I begin refactoring the existing `frontend/` (Vite) and `backend/` (Django) to align with the new specifications while keeping the current stack?
