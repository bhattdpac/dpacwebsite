# Project Instructions: dpacwebsite

## Application Building Context
Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, features, and scope
2. `context/architecture.md` — system structure, boundaries, storage model, and invariants
3. `context/ui-context.md` — theme, colors, typography, and component conventions
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase, completed work, open questions, and next steps

Update `context/progress-tracker.md` after each meaningful implementation change. If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.

## Architecture Overview
- **Frontend:** React (TypeScript) + Vite + Tailwind CSS.
- **Backend:** Django REST Framework + spaCy (NLP).
- **Blockchain:** Hardhat + Solidity.
- **Integration:** Django triggers Hardhat scripts for contract generation and deployment.

## Development Workflows
- Always verify smart contract templates in `blockchain/contracts/templates/` before generation.
- Templates use Jinja2 (`.j2`) and must inherit from `BaseLegalContract.sol`.
- Use `backend/test_generation.py` to verify the generation engine without full deployment.

## Deployment to VPS
- **Backend:** Gunicorn + Nginx.
- **Frontend:** Static build served by Nginx.
- **Blockchain:** Local Hardhat node for development; updates to `hardhat.config.ts` required for testnets.

## Error Handling
- Per user instruction: Save error messages to `error.txt` if a critical script fails.
