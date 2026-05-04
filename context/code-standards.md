# Code Standards

## General

- **Principle:** Keep modules small and single-purpose.
- **Principle:** Fix root causes, do not layer workarounds.
- **Principle:** Do not mix unrelated concerns in one component or route.

## TypeScript (Frontend)

- **Rule:** Strict mode is required throughout the React project.
- **Rule:** Avoid `any` — use explicit interfaces or narrowly scoped types.
- **Rule:** Validate unknown external input (e.g., API responses) at system boundaries before trusting it using tools like Zod or similar.

## React (Frontend)

- **Convention:** Use functional components and hooks.
- **Convention:** Extract complex logic into custom hooks.
- **Convention:** Keep components focused on presentation; delegate business logic to hooks or utility functions.

## Python / Django (Backend)

- **Rule:** Use type hints for all function signatures and complex variable assignments.
- **Convention:** Follow PEP 8 style guidelines (enforced via Black/Ruff).
- **Convention:** Keep views (or DRF viewsets) thin; place business logic and NLP orchestration in service layers or dedicated modules.

## Solidity (Blockchain)

- **Rule:** Follow the latest Solidity style guide and best practices.
- **Rule:** Incorporate comprehensive security checks (e.g., reentrancy guards, integer overflow protection).
- **Convention:** Use NatSpec comments for all public and external functions.

## Styling

- **Rule:** Use Tailwind CSS utility classes.
- **Rule:** Avoid writing custom CSS unless absolutely necessary.
- **Rule:** Use CSS custom property tokens defined in `ui-context.md` for consistent theming.

## API Routes

- **Rule:** Validate and parse request input before any logic runs.
- **Rule:** Enforce authentication and ownership before any mutation.
- **Rule:** Return consistent, predictable JSON response shapes.

## Data and Storage

- **Rule:** Relational data and metadata belong in the database.
- **Rule:** Large generated content or raw documents belong in file storage.
- **Rule:** PII and sensitive data MUST NOT be stored on the blockchain.

## File Organization

- `frontend/src/components/` — Reusable React UI components.
- `frontend/src/pages/` — Top-level React route components.
- `backend/[app_name]/services/` — Business logic and NLP orchestration.
- `blockchain/contracts/` — Solidity source files.
- `blockchain/test/` — Smart contract tests.