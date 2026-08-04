"""
ILDLM Framework - Main FastAPI Gateway Service
Module: ildlm_backend/main.py
"""

import sys
import os
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Add 04_Implementation path so backend can leverage pipeline modules directly
impl_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "04_Implementation"))
if impl_path not in sys.path:
    sys.path.insert(0, impl_path)

from pipeline import ILDLMPipeline

app = FastAPI(
    title="ILDLM Framework API",
    description="Intelligent Legal Document Lifecycle Management - Smart Contract & Blockchain Platform",
    version="1.0.0"
)

pipeline = ILDLMPipeline()

class LegalDocumentRequest(BaseModel):
    document_title: Optional[str] = "Legal Agreement"
    document_text: str
    target_blockchain: Optional[str] = "SIMULATED_FABRIC"

class VerificationRequest(BaseModel):
    contract_address: str
    document_text: str

@app.get("/")
def read_root():
    return {
        "framework": "ILDLM (Intelligent Legal Document Lifecycle Management)",
        "status": "ONLINE",
        "docs_url": "/docs"
    }

@app.get("/api/v1/health")
def get_health():
    return {
        "status": "HEALTHY",
        "modules": {
            "nlp_extractor": "OPERATIONAL",
            "logic_builder": "OPERATIONAL",
            "smart_contract_generator": "OPERATIONAL",
            "security_verifier": "OPERATIONAL",
            "blockchain_gateway": "OPERATIONAL"
        }
    }

@app.post("/api/v1/pipeline/process")
def process_document(request: LegalDocumentRequest):
    if not request.document_text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty.")
    
    try:
        results = pipeline.process_legal_document(request.document_text)
        return {
            "status": "SUCCESS",
            "document_title": request.document_title,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {str(e)}")

@app.get("/api/v1/blockchain/status")
def get_blockchain_status():
    return {
        "network": "Hyperledger Fabric 1.4.1 (NBF-Lite)",
        "channel": "legalchannel",
        "peers": [
            {"peer": "peer0.org1.example.com", "status": "CONNECTED", "msp": "Org1MSP"}
        ],
        "orderer": "orderer.example.com",
        "ca": "ca.example.com",
        "couchdb_state": "SYNCHRONIZED"
    }

@app.post("/api/v1/verification/verify")
def verify_document_integrity(request: VerificationRequest):
    proofs = pipeline.hasher.generate_proof(request.document_text, {})
    integrity = pipeline.interactor.verify_onchain_integrity(
        contract_address=request.contract_address,
        expected_doc_hash=proofs["document_hash"]
    )
    return {
        "contract_address": request.contract_address,
        "computed_document_hash": proofs["document_hash"],
        "verification_result": integrity
    }
