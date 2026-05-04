// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BaseLegalContract
 * @dev Base contract for legal documentation on blockchain.
 * Stores the hash of the original legal document to ensure provenance.
 */
contract BaseLegalContract is Ownable {
    bytes32 public immutable documentHash;
    string public documentURI;
    bool public isFinalized;

    event DocumentFinalized(bytes32 indexed docHash, string uri);

    constructor(bytes32 _documentHash, string memory _documentURI) Ownable(msg.sender) {
        documentHash = _documentHash;
        documentURI = _documentURI;
        isFinalized = false;
    }

    /**
     * @dev Finalizes the contract, indicating it matches the agreed legal text.
     */
    function finalize() external onlyOwner {
        require(!isFinalized, "Contract already finalized");
        isFinalized = true;
        emit DocumentFinalized(documentHash, documentURI);
    }
}
