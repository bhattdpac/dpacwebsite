# Unit 10: Blockchain Deployment Layer

## Goal
Establish a reliable bridge between the Django backend and the Hardhat blockchain environment to deploy verified smart contracts to a network (local or testnet).

## Design
- **Mechanism:** The backend will use `subprocess` to execute Hardhat deployment scripts.
- **Data Flow:**
  1.  Lawyer clicks "Deploy" in the frontend.
  2.  Backend fetches the `generated_code` and parameters from `ContractProposal`.
  3.  Backend writes the code to a temporary `.sol` file in `blockchain/contracts/deployments/`.
  4.  Backend executes `npx hardhat run scripts/deploy_generated.ts --network localhost`.
  5.  The script deploys the contract and returns the address and transaction hash.
  6.  Backend updates the `ContractProposal` with the deployment details.

## Implementation Tasks

### 1. Backend: Deployment Service
- Create `deployment_service.py` in the backend.
- Logic to handle temporary file creation and Hardhat execution.
- Update `ContractProposal` model with `contract_address` and `transaction_hash`.

### 2. Blockchain: Dynamic Deployment Script
- Create `blockchain/scripts/deploy_generated.ts` that:
  - Compiles the newly generated contract.
  - Deploys it using `ethers.js`.
  - Outputs the address and hash in a parseable format (JSON).

### 3. API & Frontend Integration
- Add `deploy` action to `DocumentViewSet`.
- Update `ContractPreview.tsx` (Lawyer view) to show a "Deploy to Blockchain" button.

## Verify when done
- [ ] Backend can successfully trigger a Hardhat deployment.
- [ ] Deployed contract address and transaction hash are saved in the database.
- [ ] User can see the deployment status on the dashboard.
