// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseLegalContract.sol";

/**
 * @title ConfidentialityNDA
 * @dev Represents a Non-Disclosure Agreement hash registry with party identities.
 */
contract ConfidentialityNDA is BaseLegalContract {
    address public disclosingParty;
    address public receivingParty;
    uint256 public termDuration;
    uint256 public creationTime;
    
    event NDATerminatedMutually();

    constructor(
        bytes32 _docHash,
        string memory _docURI,
        address _disclosingParty,
        address _receivingParty,
        uint256 _termDuration
    ) BaseLegalContract(_docHash, _docURI) {
        require(_disclosingParty != address(0), "Disclosing party cannot be zero address");
        require(_receivingParty != address(0), "Receiving party cannot be zero address");
        
        disclosingParty = _disclosingParty;
        receivingParty = _receivingParty;
        termDuration = _termDuration;
        creationTime = block.timestamp;
    }

    /**
     * @dev Checks if the confidentiality obligation is active.
     */
    function isActive() public view returns (bool) {
        if (isFinalized && block.timestamp < creationTime + termDuration) {
            return true;
        }
        return false;
    }
}
