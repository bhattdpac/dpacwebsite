# Unit 01: Multi-Repo Scaffolding

## Goal
Initialize the three core pillars of the project: a React frontend, a Django backend, and a Hardhat blockchain environment. Ensure all three can run basic "Hello World" or health check states and are organized according to the project's system boundaries.

## Design
The project will follow a monorepo-style structure within the `D:\2026\dpacwebsite` directory:
- `/frontend`: React (Vite) + TypeScript + Tailwind CSS.
- `/backend`: Django + Django Rest Framework (DRF) + Python type hints.
- `/blockchain`: Hardhat + Solidity + Ethers.js for testing.

## Implementation

### 1. Frontend Scaffolding
- Initialize a Vite project with the `react-ts` template.
- Install Tailwind CSS and its dependencies.
- Configure `tailwind.config.js` with the color tokens from `ui-context.md`.
- Create a basic "LegalDocSystem" landing page.

### 2. Backend Scaffolding
- Create a Python virtual environment.
- Install Django, Django Rest Framework, and `django-cors-headers`.
- Initialize the Django project named `core` and an app named `api`.
- Configure CORS to allow requests from the frontend.
- Create a simple `/api/health/` endpoint.

### 3. Blockchain Scaffolding
- Initialize a Hardhat project.
- Choose the "Create a TypeScript project" option.
- Install basic dependencies (`@nomicfoundation/hardhat-toolbox`).
- Create a simple "Storage" or "Health" contract to verify the environment.

## Dependencies
- Node.js & npm (for frontend and blockchain).
- Python 3.x (for backend).
- Vite, Tailwind CSS.
- Django, DRF.
- Hardhat.

## Verify when done
- [ ] `frontend/` starts with `npm run dev`.
- [ ] `backend/` health check endpoint returns 200 OK.
- [ ] `blockchain/` tests pass with `npx hardhat test`.
- [ ] `npm run build` passes for the frontend.
- [ ] No linting or type errors in any directory.
