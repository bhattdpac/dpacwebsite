# Plan: Transformation to PhD Research Platform

This plan outlines the steps to transform `deepakbhatt.dev` from a general Web3 portfolio into a comprehensive, living PhD research laboratory and evidence repository.

## Goal
To create a professional, data-driven academic research platform that tracks PhD progress, documents experiments, manages publications, and serves as the primary evidence source for RDC/RAC committee reviews.

## Roadmap

### Sprint 1: Foundation & Academic Identity
- **Homepage Redesign (`PortfolioHome.tsx`):**
  - Update Hero: "AI Researcher | Blockchain Researcher | Assistant Professor".
  - Hero Stats: Implement real-time (or easily updatable) counters for Experiments, Papers Read, Publications, and a Research Progress gauge.
  - Objective Overview: Showcase the 3-4 primary PhD research objectives with progress bars.
- **Navigation:** Update navigation to include: About, Research, Publications, Experiments, Journal, Teaching, Downloads.

### Sprint 2: Research Dashboard & Dynamic Objectives
- **Backend:**
  - Implement `ResearchObjective` model (title, description, progress_percentage, status).
  - Implement `ResearchObjectiveViewSet` and register API routes.
- **Frontend:**
  - Create `ResearchDashboard.tsx`: A central hub for tracking the PhD timeline, objectives, and high-level progress.
  - Implement a visual "Research Timeline" (SVG/CSS based).

### Sprint 3: Publications & Literature Repository
- **Backend:**
  - Implement `Publication` model (title, authors, venue, year, abstract, doi, status, file_url, citation).
  - Extend/Refine `ResearchPaper` model to include "Research Gap", "Dataset Notes", and "Implementation Status" to serve as a Literature Review database.
- **Frontend:**
  - Create `Publications.tsx`: A clean, searchable list of papers with download links and citations.
  - Create `LiteratureReview.tsx`: A searchable library of academic papers analyzed during the PhD.

### Sprint 4: Experiments & Research Journal
- **Backend:**
  - Implement `Experiment` model (title, goal, dataset, model_details, metrics [Accuracy, F1, etc.], observations, future_work).
  - Implement `ResearchLog` model (week_number, date, achievements, blockers, next_goals).
- **Frontend:**
  - Create `ExperimentLog.tsx`: A technical log of every experiment run, serving as evidence for the thesis.
  - Create `ResearchJournal.tsx`: A weekly research diary to demonstrate continuous progress.

### Sprint 5: Admin Portal & Document Center
- **Backend:**
  - Register all new models in `admin.py` for easy data entry.
  - Implement a "Stats Summary" endpoint for the homepage counters.
- **Frontend:**
  - Create `Downloads.tsx`: A centralized place for CV, Synopsis, and Research Proposals.
  - Implement "Admin UI" elements (Quick Add buttons) visible only to authenticated Researchers (Lawyer role).

## Verification Strategy
- **Backend:** Unit tests for each new model and API endpoint (`api.tests`).
- **Frontend:** Build verification (`npm run build`) and manual UI review for responsiveness and theme alignment (Cyber Sunset).
- **End-to-End:** Verify that a new experiment or journal entry added via Admin/API immediately reflects on the dashboard.
