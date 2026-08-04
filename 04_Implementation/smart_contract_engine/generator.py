"""
ILDLM Framework - Smart Contract Code Generator
Module: smart_contract_engine/generator.py
"""

import re
from typing import Dict, Any, List
from .templates import SOLIDITY_LEGAL_CONTRACT_TEMPLATE, FABRIC_CHAINCODE_TEMPLATE
from .verifier import ContractVerifier

class SmartContractGenerator:
    """
    Generates verified smart contract code (Solidity & Hyperledger Fabric Chaincode)
    from extracted legal entities and parsed logic rules.
    """

    def __init__(self):
        self.verifier = ContractVerifier()

    def _sanitize_name(self, text: str) -> str:
        """Sanitizes text to valid programming identifier name."""
        clean = re.sub(r'[^a-zA-Z0-9]', '', text)
        if not clean or not clean[0].isalpha():
            clean = "LegalContract" + clean
        return clean[:32]

    def generate_solidity_contract(
        self,
        extracted_info: Dict[str, Any],
        logic_rules: List[Dict[str, Any]],
        document_hash: str
    ) -> Dict[str, Any]:
        """Generates EVM-compatible Solidity code with integrated legal constraints."""
        parties = extracted_info.get("parties", [])
        party_a = parties[0] if len(parties) > 0 else {"name": "Disclosing Party", "role": "PartyA"}
        party_b = parties[1] if len(parties) > 1 else {"name": "Receiving Party", "role": "PartyB"}
        
        governing_law = extracted_info.get("governing_law", "General Jurisdiction")
        contract_name = self._sanitize_name(party_a["name"] + "Vs" + party_b["name"] + "Agreement")

        # Format template
        code = SOLIDITY_LEGAL_CONTRACT_TEMPLATE.format(
            contract_name=contract_name,
            document_hash=document_hash,
            governing_law=governing_law,
            party_a_name=party_a["name"],
            party_a_role=party_a["role"],
            party_b_name=party_b["name"],
            party_b_role=party_b["role"]
        )

        # Run verification checks
        verification_report = self.verifier.verify_solidity(code)

        return {
            "target": "Solidity (EVM)",
            "contract_name": contract_name,
            "document_hash": document_hash,
            "code": code,
            "verification": verification_report
        }

    def generate_fabric_chaincode(
        self,
        extracted_info: Dict[str, Any],
        document_hash: str
    ) -> Dict[str, Any]:
        """Generates Hyperledger Fabric Go Chaincode."""
        parties = extracted_info.get("parties", [])
        party_a_name = parties[0]["name"] if len(parties) > 0 else "PartyA"
        party_b_name = parties[1]["name"] if len(parties) > 1 else "PartyB"
        
        return {
            "target": "Hyperledger Fabric (Go)",
            "contract_name": "LegalContractChaincode",
            "document_hash": document_hash,
            "code": FABRIC_CHAINCODE_TEMPLATE
        }
