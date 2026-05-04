# Unit 09: Client Explanation & Feedback System

## Goal
Bridge the technical gap by providing non-technical clients with a plain-language summary of what the generated smart contract will do once deployed to the blockchain. This ensures informed consent and trust.

## Design
- **Client Dashboard:** A simplified view for users with the "Client" role.
- **Contract Preview Page:**
  - **Left:** The generated Solidity code (read-only, for transparency).
  - **Right:** "What this means for you" - A human-readable breakdown of the contract's logic (e.g., "This contract will hold 2.5 ETH and release it only when Lawyer X approves").
  - **Action:** A "Client Approval" button that updates the `ContractProposal` status.

## Implementation Tasks

### 1. Backend: Explanation Logic
- Update `ContractProposal` model to include `client_approved` (Boolean) and `client_feedback` (TextField).
- Implement a helper in `generation_service.py` to generate a "Client-Friendly Summary" based on the template used and parameters injected.

### 2. Frontend: Client Preview Page
- Create `ContractPreview.tsx`.
- Implement a "Code vs. Intent" view.
- Add approval workflow (API call to PATCH proposal status).

### 3. Navigation
- Ensure Clients can see their documents on the dashboard and click "Review Contract".

## Verify when done
- [ ] Clients can view a human-readable summary of the smart contract.
- [ ] The summary correctly reflects parameters (e.g., the correct amount and payer address).
- [ ] Clients can approve the contract, and the status is saved in the database.
- [ ] Lawyers can see when a client has approved the contract.
