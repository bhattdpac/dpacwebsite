# Unit 06: Solidity Contract Templates

## Goal
Develop a library of security-focused Solidity contract templates that represent standard legal clauses. These templates will serve as the building blocks for dynamic smart contract generation.

## Design
We will focus on three core "Modular Clauses":
1.  **PaymentEscrow.sol:** Handles milestone-based payments with automated release or refund.
2.  **TerminationLogic.sol:** Manages contract state and restricts access once specific conditions (time or mutual consent) are met.
3.  **LegalRegistry.sol:** A base contract for storing document hashes and metadata to ensure immutability and provenance.

## Implementation Tasks

### 1. Smart Contract Development
- Create `contracts/templates/PaymentEscrow.sol`.
- Create `contracts/templates/TerminationLogic.sol`.
- Create `contracts/templates/BaseLegalContract.sol` (inheriting from OpenZeppelin for security).

### 2. Testing
- Write Hardhat tests in `test/Templates.ts` to verify the logic of each template.
- Ensure 100% pass rate for payment releases and state transitions.

### 3. Integration Prep
- Ensure ABI and Bytecode are generated correctly for the backend to consume later.

## Dependencies
- `@openzeppelin/contracts` (for `Ownable`, `ReentrancyGuard`, etc.).

## Verify when done
- [ ] `PaymentEscrow.sol` compiles and handles ETH/Token transfers correctly.
- [ ] `TerminationLogic.sol` correctly locks functions after contract expiry.
- [ ] All unit tests pass using `npx hardhat test`.
