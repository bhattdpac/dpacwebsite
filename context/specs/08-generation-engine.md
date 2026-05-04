# Unit 08: Smart Contract Generation Engine

## Goal
Implement the logic to dynamically assemble customized Solidity source code by injecting extracted parameters into the pre-approved contract templates.

## Design
The "Generation Engine" will:
1.  **Load Template:** Read the `.sol` source file from the disk.
2.  **Inject Parameters:** Replace placeholders or use a factory pattern to customize the contract.
3.  **Validate:** Ensure the generated code is syntactically correct.
4.  **Persistence:** Save the generated code to the `ContractProposal.generated_code` field.

### Assembly Strategy:
For the MVP, we will use a **Constructor-Injection** approach. The templates are already written to be generic. The "Generation" step will focus on creating a **Deployment Wrapper** or a specific instance of the template with hardcoded values if needed for simplicity, OR just preparing the arguments for the factory.

However, a more robust "Generation" for a PhD project involves actually modifying the source or using a factory. Let's go with **Source Modification** (String templating) for the final on-chain verification benefit (matching exactly what was approved).

## Implementation Tasks

### 1. Generation Service
- Implement `generation_service.py` in the backend.
- Use `jinja2` (already in venv) to handle Solidity templating.
- Map `Proposal.parameters` to template variables.

### 2. Template Refactoring
- Update `.sol` templates in `blockchain/contracts/templates/` to use Jinja2 placeholders (e.g., `{{ totalAmount }}`).

### 3. API Integration
- Update `DocumentViewSet.proposal` action to trigger generation.

## Verify when done
- [ ] Backend can generate a valid `.sol` file for a "PaymentEscrow" proposal.
- [ ] Placeholders like `{{ payer }}` are correctly replaced with Ethereum addresses.
- [ ] Generated code is stored in the database.
