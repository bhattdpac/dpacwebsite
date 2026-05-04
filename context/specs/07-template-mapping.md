# Unit 07: Template Selection & Mapping

## Goal
Develop the backend logic to automatically suggest specific Solidity templates based on the types and content of legal clauses extracted by the NLP engine.

## Design
The "Mapping Engine" will live in the Django backend and perform the following:
1.  **Categorization:** Match `Clause.type` to available `Template` IDs.
2.  **Parameter Extraction:** Identify specific values (addresses, amounts, dates) within the clause text to populate template fields.
3.  **Proposals:** Store the mapping in a new `ContractProposal` model.

### Mapping Table:
| NLP Clause Type | Solidity Template | Parameters Needed |
| :--- | :--- | :--- |
| PAYMENT | PaymentEscrow.sol | Payer, Payee, TotalAmount |
| TERMINATION | TerminationLogic.sol | Duration (Days) |
| GENERAL | BaseLegalContract.sol | DocHash, DocURI |

## Implementation Tasks

### 1. Database Model
- Create `SmartContractTemplate` model to store template metadata and source code references.
- Create `ContractProposal` model to link a `Document` to a set of proposed templates and their parameters.

### 2. Mapping Service
- Implement `mapping_service.py` in the backend.
- Logic to scan approved clauses and generate proposals.
- Use spaCy entities (from Unit 04) to auto-fill parameters like "MONEY" for amounts.

### 3. API Updates
- Endpoint to fetch proposals for a document: `GET /api/documents/{id}/proposals/`.

## Verify when done
- [ ] Backend can identify a "PAYMENT" clause and suggest the "PaymentEscrow" template.
- [ ] System extracts "Amount" and "Currency" from payment clauses when available.
- [ ] A `ContractProposal` is created automatically after all clauses are approved.
