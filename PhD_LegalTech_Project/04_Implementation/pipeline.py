"""
ILDLM Framework - Master Pipeline Orchestrator
Module: 04_Implementation/pipeline.py
"""

import os
import json
import sys
from typing import Dict, Any

# Add current dir to sys.path so modules can import seamlessly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from nlp_module import LegalExtractor, LegalParser
from logic_module import LogicBuilder
from smart_contract_engine import SmartContractGenerator
from blockchain_integration import DocumentHasher, BlockchainDeployer, ContractInteractor

class ILDLMPipeline:
    """
    End-to-End Orchestrator for the Intelligent Legal Document Lifecycle Management (ILDLM) Framework.
    """

    def __init__(self, network_target: str = "SIMULATED_FABRIC"):
        self.extractor = LegalExtractor()
        self.parser = LegalParser()
        self.logic_builder = LogicBuilder()
        self.generator = SmartContractGenerator()
        self.hasher = DocumentHasher()
        self.deployer = BlockchainDeployer(network_type=network_target)
        self.interactor = ContractInteractor()

    def process_legal_document(self, document_text: str) -> Dict[str, Any]:
        """
        Executes complete pipeline from legal text input to blockchain verified deployment.
        """
        print("[1/5] Extracting Legal Entities & Parties...")
        entities = self.extractor.extract_all(document_text)

        print("[2/5] Parsing Legal Clauses & Modalities...")
        parsed_clauses = self.parser.parse_document(document_text)

        print("[3/5] Building Formal IF-THEN Execution Logic...")
        logic_rules = self.logic_builder.build_logic_rules(parsed_clauses, entities)

        print("[4/5] Generating Cryptographic Hashes & Proofs...")
        proofs = self.hasher.generate_proof(document_text, entities)

        print("[5/5] Generating Verified Smart Contract Code (Solidity & Fabric)...")
        solidity_result = self.generator.generate_solidity_contract(
            extracted_info=entities,
            logic_rules=logic_rules,
            document_hash=proofs["document_hash"]
        )
        fabric_result = self.generator.generate_fabric_chaincode(
            extracted_info=entities,
            document_hash=proofs["document_hash"]
        )

        print("[COMPLETE] Deploying Verified Contract to Blockchain Ledger...")
        deployment = self.deployer.deploy_contract(
            contract_name=solidity_result["contract_name"],
            code=solidity_result["code"],
            document_hash=proofs["document_hash"]
        )

        onchain_verification = self.interactor.verify_onchain_integrity(
            contract_address=deployment["contract_address"],
            expected_doc_hash=proofs["document_hash"]
        )

        return {
            "pipeline_status": "SUCCESS",
            "extracted_entities": entities,
            "parsed_clauses": parsed_clauses,
            "logic_rules": logic_rules,
            "integrity_proofs": proofs,
            "solidity_contract": solidity_result,
            "fabric_chaincode": fabric_result,
            "blockchain_deployment": deployment,
            "onchain_verification": onchain_verification
        }

if __name__ == "__main__":
    sample_nda = """
    MUTUAL NON-DISCLOSURE AGREEMENT
    
    THIS AGREEMENT is entered into on July 12, 2026, BY AND BETWEEN
    Apex Software Solutions Inc. ("Disclosing Party") AND Quantum AI Research Labs ("Receiving Party").
    
    SECTION 1: CONFIDENTIAL INFORMATION
    The Receiving Party shall maintain all proprietary software code as strictly confidential.
    
    SECTION 2: OBLIGATIONS AND PAYMENT
    The Receiving Party shall pay a security deposit of USD 50,000 within 30 days upon execution.
    If the Receiving Party fails to pay within 30 days, the Disclosing Party shall charge a penalty fee of USD 5,000.
    
    SECTION 3: GOVERNING LAW
    This Agreement shall be governed by and construed in accordance with the laws of California.
    """
    
    pipeline = ILDLMPipeline()
    results = pipeline.process_legal_document(sample_nda)
    print("\n" + "="*60)
    print("ILDLM PIPELINE EXECUTION SUMMARY")
    print("="*60)
    print(f"Contract Name: {results['solidity_contract']['contract_name']}")
    print(f"Document Hash: {results['integrity_proofs']['document_hash']}")
    print(f"Contract Address: {results['blockchain_deployment']['contract_address']}")
    print(f"Security Verification Score: {results['solidity_contract']['verification']['security_score']}/100 ({results['solidity_contract']['verification']['status']})")
    print(f"On-Chain Integrity: {results['onchain_verification']['integrity_status']}")
    print("="*60)
