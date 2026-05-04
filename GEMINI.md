# Project Instructions: dpacwebsite

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
