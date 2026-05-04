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
- **Configurations:** Templates for Gunicorn and Nginx are located in the `deployment/` directory.
- **Backend:** 
    1. Copy `deployment/gunicorn.service` to `/etc/systemd/system/`.
    2. Start and enable: `systemctl start gunicorn && systemctl enable gunicorn`.
- **Nginx:** 
    1. Copy `deployment/nginx.conf` to `/etc/nginx/sites-available/dpacwebsite`.
    2. Link to enabled sites: `ln -s /etc/nginx/sites-available/dpacwebsite /etc/nginx/sites-enabled/`.
    3. Test and restart: `nginx -t && systemctl restart nginx`.
- **Automated Deployment:** Use `deployment/deploy.sh` for updates. Ensure it has execute permissions: `chmod +x deployment/deploy.sh`.
- **Database:** Mainnet requires PostgreSQL. Update `.env` with `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` before running migrations on VPS.

## Error Handling
- Per user instruction: Save error messages to `error.txt` if a critical script fails.
