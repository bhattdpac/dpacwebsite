# One improvement I'd make

Given everything we've worked on over the last year, I would make deepakbhatt.dev follow a documentation-first workflow, similar to how mature software teams operate.

Every feature should start with this sequence:

Requirement (Which PhD objective does it support?)
Design (Architecture and UI)
Implementation
Testing
Documentation
Deployment

That discipline will help ensure your website remains aligned with your approved research objectives while also becoming a strong body of evidence for your RDC reviews and future publications.

# ROLE

You are a senior software architect, UI/UX designer, research software engineer, academic website consultant, and full-stack developer.

You are NOT allowed to redesign my project immediately.

Your first responsibility is to understand my existing project completely before suggesting modifications.

---

# CONTEXT

I already have a website under development for my personal domain:

deepakbhatt.dev

The website already contains pages, components, routing, styling, and functionality.

DO NOT assume it is empty.

Treat this as an existing production codebase.

---

# PRIMARY OBJECTIVE

My website is no longer just a personal portfolio.

It must become a **Research Management System (RMS)** that supports my PhD research.

The website should satisfy my official PhD objectives while acting as

• Academic Portfolio
• Research Dashboard
• RDC Evidence Repository
• Publication Manager
• Experiment Tracker
• Literature Review System

---

# OFFICIAL THESIS

Aim

Implement smart contracts using blockchain technology for secure and transparent legal documentation.

Official Objectives

Objective 1

Investigate smart contracts and blockchain technology for legal documentation.

Objective 2

Evaluate blockchain security ensuring integrity and transparency.

Objective 3

Design and propose a comprehensive framework.

Objective 4

Measure effectiveness regarding

- Cost
- Efficiency
- Fraud Reduction

Every feature you recommend must support one or more of these objectives.

If it does not contribute to an objective, explain why it should or should not exist.

---

# IMPORTANT

Before writing ANY code:

Read the entire project.

Understand

- Folder structure
- Components
- Routing
- APIs
- Database
- Styling
- Existing pages
- Current features

Do NOT generate new code until you understand the architecture.

---

# STEP 1

Perform a complete project audit.

Generate a report containing

## Architecture

Explain the current architecture.

## Technology

Identify every framework and dependency.

## Folder Structure

Explain every major folder.

## Components

List reusable components.

## Pages

List every page.

## Features

List completed features.

## Missing Features

List missing features.

## Dead Code

Identify unused code.

## Duplicate Code

Identify duplication.

## Performance Issues

List improvements.

## Security Issues

List risks.

## SEO Issues

Review SEO.

## Accessibility

Review accessibility.

## UI Consistency

Review design consistency.

## Responsive Design

Review mobile compatibility.

---

# STEP 2

Compare the existing website against my PhD objectives.

Create a table.

Current Feature

↓

Supports Objective?

↓

Improvement Required?

↓

Priority

---

# STEP 3

Create a gap analysis.

What is missing?

What should be removed?

What should stay?

What should be redesigned?

---

# STEP 4

Create a Product Requirements Document (PRD)

Include

Mission

Users

Goals

Modules

Database

Pages

Navigation

User Flows

Dashboard

Analytics

---

# STEP 5

Only after approval

Generate an implementation roadmap.

Break work into

Sprint 1

Sprint 2

Sprint 3

Sprint 4

Sprint 5

Each sprint must

- Have measurable outcomes
- Be independently deployable
- Not break existing functionality

---

# DESIGN PRINCIPLES

Use

Minimal

Academic

Professional

Research-focused

No unnecessary animations.

No flashy effects.

The website should look like a professional AI research laboratory.

---

# CODING RULES

Never rewrite working code unnecessarily.

Prefer refactoring.

Maintain reusable components.

Follow clean architecture.

Document every decision.

When modifying files, explain

Why

Benefits

Risks

Alternative approaches

---

# OUTPUT FORMAT

Always respond with

1. Findings

2. Recommendations

3. Risks

4. Implementation Plan

5. Code Changes

Never skip the analysis phase.
Never jump directly into coding.


# PhD Research Management System (PRMS) -- Master Specification

## Purpose

Build a Research Management System (RMS) for **deepakbhatt.dev** that
serves as: 1. Personal research operating system. 2. Public academic
portfolio. 3. RDC/RAC evidence repository. 4. PhD progress tracker. 5.
Experiment and publication management platform.

This is **not** a generic portfolio.

## Official Thesis

### Aim

Implement smart contracts using blockchain technology for secure and
transparent legal documentation.

### Objective 1

Investigate the core principles of smart contracts and blockchain
technology focusing on legal documentation.

**Deliverables** - Literature review - Research gap analysis - Related
work comparison - Taxonomy - Annotated bibliography

### Objective 2

Evaluate blockchain security features ensuring integrity and
transparency.

**Deliverables** - Security architecture - Hash verification - Digital
signatures - Threat model - Security experiments

### Objective 3

Design and propose a comprehensive framework.

**Deliverables** - Overall architecture - Workflow - Smart contract
module - AI/NLP module (supporting technology) - Blockchain
integration - Prototype

### Objective 4

Measure effectiveness.

**Deliverables** - Performance comparison - Cost analysis - Time
analysis - Fraud reduction - Statistical evaluation

# Website Modules

-   Home
-   About
-   Research
-   Publications
-   Experiments
-   Literature Review
-   Weekly Research Journal
-   Projects
-   Teaching
-   Downloads
-   Contact

## Research Section

-   Overview
-   Aim
-   Objective 1
-   Objective 2
-   Objective 3
-   Objective 4
-   Timeline
-   Dashboard

## Dashboard

Track: - Overall PhD completion - Objective completion - Papers read -
Experiments - Publications - Git commits - Deep work hours

## Literature Database

Fields: - Paper ID - Title - Authors - Year - DOI - Venue - Dataset -
Method - Research Gap - Limitations - Notes

## Experiment Tracker

Fields: - Experiment ID - Objective - Dataset - Model - Parameters -
Metrics - Results - Observation - Next Action

## Publication Tracker

Stages: Idea → Draft → Submitted → Under Review → Accepted → Published

## Weekly Journal

Every week log: - Papers read - Code written - Experiments - Results -
Blockers - Next week plan

## RDC Module

Store: - Meeting - Progress - Evidence - Publications - Experiments -
Corrections - Action items

## Admin

-   Login
-   CRUD papers
-   CRUD experiments
-   CRUD publications
-   Markdown editor
-   File upload

## Tech Stack

Frontend: - Next.js - Tailwind CSS

Backend: - FastAPI

Database: - PostgreSQL

Charts: - Chart.js

Deployment: - Docker - GitHub Actions

## Development Roadmap

Phase 1: Homepage, Dashboard, Research

Phase 2: Literature + Experiments

Phase 3: Publications + Journal

Phase 4: RDC + Analytics + Export

Phase 5: Production deployment

## Success Criteria

The system must: - Align every feature to one of the four approved
research objectives. - Act as the single source of truth for research
evidence. - Help prepare RAC/RDC reviews quickly. - Showcase research,
publications, software, and experiments. - Be maintainable,
reproducible, and professionally designed.


One suggestion before you hand this to Gemini CLI: don't ask it to build everything in one shot. A specification is good, but large end-to-end code generation often produces inconsistent architecture.

Instead, treat this as the master requirements document and implement in phases:

Foundation
Next.js project
Tailwind CSS
Routing
Authentication
Layout
Research Module
Research overview
Aim
Four objectives
Progress dashboard
Literature Module
Paper database
Search
Tags
Notes
Experiment Module
CRUD
Metrics
Charts
Version history
Publication Module
Publications
Conference tracker
PDF management
RDC Module
Meeting history
Evidence repository
Progress reports
PDF export
Analytics
Progress charts
KPIs
Timeline
Weekly reports
Deployment
Docker
CI/CD
Production

I also think we should create a much more detailed Software Requirements Specification (SRS)—around 80–100 pages—covering database schema, API endpoints, UI wireframes, folder structure, component hierarchy, user stories, sequence diagrams, and deployment architecture. That would give Gemini CLI or any coding assistant a much clearer blueprint and make it far more likely to generate a clean, maintainable system rather than a collection of loosely connected pages.