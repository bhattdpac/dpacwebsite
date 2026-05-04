// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Health {
    string public status;

    constructor() {
        status = "Healthy";
    }

    function getStatus() public view returns (string memory) {
        return status;
    }
}
