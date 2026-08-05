// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseLegalContract.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SecuredLoan
 * @dev Loan agreement with collateral locking and default tracking.
 */
contract SecuredLoan is BaseLegalContract, ReentrancyGuard {
    address public lender;
    address public borrower;
    uint256 public loanAmount;
    uint256 public interestRate; // Basis points (e.g. 500 = 5%)
    uint256 public repaymentDeadline;
    
    enum State { Pending, Active, Repaid, Defaulted }
    State public state;

    event LoanFunded();
    event LoanRepaid();
    event LoanDefaulted();

    constructor(
        bytes32 _docHash,
        string memory _docURI,
        address _lender,
        address _borrower,
        uint256 _loanAmount,
        uint256 _interestRate,
        uint256 _repaymentDeadline
    ) BaseLegalContract(_docHash, _docURI) {
        require(_lender != address(0), "Lender cannot be zero address");
        require(_borrower != address(0), "Borrower cannot be zero address");
        require(_repaymentDeadline > block.timestamp, "Deadline must be in future");
        
        lender = _lender;
        borrower = _borrower;
        loanAmount = _loanAmount;
        interestRate = _interestRate;
        repaymentDeadline = _repaymentDeadline;
        state = State.Pending;
    }

    /**
     * @dev Lender funds the loan principal.
     */
    function fundLoan() external payable {
        require(msg.sender == lender, "Only lender can fund");
        require(state == State.Pending, "Not in pending state");
        require(msg.value == loanAmount, "Incorrect loan amount");
        
        state = State.Active;
        emit LoanFunded();
        
        (bool success, ) = payable(borrower).call{value: msg.value}("");
        require(success, "Transfer to borrower failed");
    }

    /**
     * @dev Borrower repays the loan amount + interest.
     */
    function repayLoan() external payable nonReentrant {
        require(msg.sender == borrower, "Only borrower can repay");
        require(state == State.Active, "Loan not active");
        require(block.timestamp <= repaymentDeadline, "Repayment deadline missed");
        
        uint256 totalRepayment = loanAmount + (loanAmount * interestRate / 10000);
        require(msg.value == totalRepayment, "Incorrect repayment amount");
        
        state = State.Repaid;
        emit LoanRepaid();
        
        (bool success, ) = payable(lender).call{value: msg.value}("");
        require(success, "Transfer to lender failed");
    }

    /**
     * @dev Lender claims default if the deadline has passed without repayment.
     */
    function claimDefault() external {
        require(msg.sender == lender, "Only lender can claim default");
        require(state == State.Active, "Loan not active");
        require(block.timestamp > repaymentDeadline, "Deadline has not passed yet");
        
        state = State.Defaulted;
        emit LoanDefaulted();
    }
}
