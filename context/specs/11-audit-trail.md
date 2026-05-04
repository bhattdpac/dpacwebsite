# Unit 11: Audit Trail & On-Chain Status

## Goal
Finalize the framework by providing users with a comprehensive audit trail that documents the entire lifecycle of a legal document—from its original text to its on-chain deployment.

## Design
- **Audit Dashboard:** A new section or expanded view in the Dashboard.
- **On-Chain Links:** Direct links to transaction hashes and contract addresses.
- **Workflow History:** A timeline showing:
  1.  Document Uploaded.
  2.  NLP Extraction Complete.
  3.  Lawyer Approved Clauses.
  4.  Client Approved Contract.
  5.  Deployed to Blockchain.

## Implementation Tasks

### 1. Frontend: Audit Timeline
- Create a `DeploymentTimeline.tsx` component.
- Display timestamps for each major milestone in the `ContractProposal` and `Document` lifecycle.

### 2. Dashboard Enhancements
- Update `Dashboard.tsx` to include "Recent Deployments" with quick links to addresses.
- Use a "Success" badge for documents that have a valid `contract_address`.

### 3. Final Verification
- Ensure the end-to-end flow works flawlessly on a local Hardhat node.

## Verify when done
- [ ] Users can see a list of all deployed contracts.
- [ ] Clicking a deployment shows the original document vs. the deployed Solidity code.
- [ ] Visual indicators (checkmarks) confirm each stage of the audit trail.
