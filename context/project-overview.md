# DPAC Research Platform v2.0 - Project Overview

## Vision

Build a world-class AI Research Platform that showcases Deepak Bhatt's academic work, hosts interactive Legal AI demonstrations, documents his research journey, and serves as the modular foundation for a future commercial Legal AI SaaS platform.

The platform is **not** a simple portfolio, blog, or legal app; it is a unified ecosystem combining all three to function as a:
* Personal research website & branding hub
* AI laboratory for interactive model testing
* Publication repository with rich metadata
* Live demo environment for legal tools
* Documentation portal for algorithms and systems
* Startup landing page & commercialization pipeline
* Research management system & dashboard

## Product Philosophy & Design Principles

- **Modular & Reusable:** Every component (publication cards, demo grids, project pages, auth layers, analytics) must be modularly reusable inside the future commercial SaaS platform.
- **AI-First & Academic:** Clean, minimal layout utilizing Inter & Space Grotesk. Polished micro-interactions and transitions (inspired by Vercel/Anthropic).
- **Fast & Accessible:** Keyboard navigable, responsive, search-engine optimized (SEO structured data for papers), and WCAG 2.2 AA compliant.

## Information Architecture

### 1. Public Website Pages
* **Home:** Hero section ("Building Intelligent Legal AI Systems using LLMs, Agentic AI and Blockchain"), research highlights, latest publication, research stats, timeline, and CTA.
* **About:** Biography, academic journey, research interests, awards, experience, teaching logs, and CV download.
* **Research Areas:** Modular sub-sections for:
  - *Legal AI*
  - *Natural Language Processing*
  - *Blockchain & Smart Contracts*
  - *Explainable AI*
  - *Large Language Models*
  - *Procedural Information Extraction*
  - *Retrieval-Augmented Generation (RAG)*
  Each area details the: Overview, Research Gap, Methodology, Publications, Datasets, Code, and Future Work.
* **Publications:** Searchable and filterable database listing titles, abstracts, keywords, DOI, PDF files, citations (with BibTeX copier), GitHub code, datasets, presentations, and related projects.
* **Projects:** Dedicated project profile pages outlining the: Problem, Architecture, Tech Stack, Screenshots, Research Contribution, Demo link, Github repo, Roadmap, and Current Status.
* **AI Laboratory:** The signature interactive sandbox displaying live prototypes for:
  - *Document Analysis*
  - *Clause Extraction*
  - *Procedural Extraction*
  - *Legal Summarization*
  - *Smart Contract Generation*
  - *Blockchain Verification*
  - *Semantic Search & RAG Assistant*
  Each demo carries status indicators: `Research Prototype`, `Experimental Status`, `Human Review Required`.
* **Teaching:** Course curriculum (e.g. UU-CS-501, UU-CS-502), lecture slides, assignment guides, FAQs, and resources.
* **Blog:** Research diary, conference reports, technical articles, and system development logs.
* **Contact:** Direct channels for Academic, Collaboration, Student, Media, and Research Enquiries.

### 2. Internal Research Dashboard
Internal management dashboard for controlling:
- Publications database and project roadmaps
- Reading lists, dead-ends, ideas backlog, and research notes
- Conference submissions tracker and deadline countdowns
- Thesis progress metrics

### 3. Legal AI Platform (Scoped SaaS Module)
A separate application workspace within the ecosystem containing:
- Document uploader (OCR & parsing)
- Clause extraction & Named Entity Recognition (NER)
- Risk analysis & Explainable AI (XAI) confidence scores
- Smart contract templates generation & Slither security auditing
- On-chain deployment registration, versioning, and monitoring

### 4. Admin Panel & CMS
Administrative UI to create, update, and delete:
- Projects, Publications, and Research areas
- Blog posts, teaching materials, and event updates
- Collaborators profiles and corpus datasets

## Future Roadmap

```text
Phase 1: Personal Research Platform
  ├── Public Website launch
  ├── Publications & Projects database
  └── Teaching resources & Blog logs
        │
        ▼
Phase 2: Interactive Research Hub
  ├── Live AI Laboratory sandboxes
  ├── Internal Research Dashboard
  ├── Global Semantic Search
  └── JWT Role-Based Auth
        │
        ▼
Phase 3: Legal AI SaaS Prototype
  ├── Intelligent document parsing (OCR & NER)
  ├── Procedural timeline extraction models
  ├── Explainable AI decision trees
  └── Security-audited contract generator
        │
        ▼
Phase 4: Research Validation
  ├── Usability testing & SUS surveys
  ├── Latency and gas benchmarking
  └── Publication-ready evaluation metrics
        │
        ▼
Phase 5: Commercialization Spin-out
  ├── Multi-tenant organization accounts
  ├── Subscription billing integration
  ├── Enterprise API platform
  └── Compliance & audit-trail logs
```

## Performance & Accessibility Requirements

- **Lighthouse Performance:** Score &gt; 95 on mobile and desktop.
- **Accessibility:** Keyboard-friendly, screen reader compatible, high contrast support, and reduced motion flags.
- **SEO & Metadata:** Open Graph tags, JSON-LD structured publication schema, and lazy loading for heavy components.