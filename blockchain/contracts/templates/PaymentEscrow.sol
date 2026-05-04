// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseLegalContract.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentEscrow
 * @dev Handles milestone-based payments for legal agreements.
 */
contract PaymentEscrow is BaseLegalContract, ReentrancyGuard {
    address public immutable payer;
    address public immutable payee;
    uint256 public immutable totalAmount;
    uint256 public amountReleased;

    enum State { Pending, Funded, Released, Refunded }
    State public state;

    event PaymentFunded(uint256 amount);
    event PaymentReleased(uint256 amount);
    event PaymentRefunded(uint256 amount);

    constructor(
        bytes32 _docHash, 
        string memory _docURI,
        address _payer,
        address _payee,
        uint256 _totalAmount
    ) BaseLegalContract(_docHash, _docURI) {
        require(_payer != address(0), "Payer cannot be zero address");
        require(_payee != address(0), "Payee cannot be zero address");
        payer = _payer;
        payee = _payee;
        totalAmount = _totalAmount;
        state = State.Pending;
    }

    /**
     * @dev Payer funds the escrow.
     */
    function fund() external payable {
        require(msg.sender == payer, "Only payer can fund");
        require(state == State.Pending, "Already funded or finished");
        require(msg.value == totalAmount, "Incorrect funding amount");
        
        state = State.Funded;
        emit PaymentFunded(msg.value);
    }

    /**
     * @dev Lawyer (Owner) releases the payment to the payee.
     */
    function release() external onlyOwner nonReentrant {
        require(state == State.Funded, "Payment not funded");
        require(isFinalized, "Contract must be finalized first");
        
        state = State.Released;
        uint256 amount = address(this).balance;
        amountReleased = amount;
        
        (bool success, ) = payable(payee).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit PaymentReleased(amount);
    }

    /**
     * @dev Lawyer (Owner) refunds the payment to the payer.
     */
    function refund() external onlyOwner nonReentrant {
        require(state == State.Funded, "Payment not funded");
        
        state = State.Refunded;
        uint256 amount = address(this).balance;
        
        (bool success, ) = payable(payer).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit PaymentRefunded(amount);
    }
}
