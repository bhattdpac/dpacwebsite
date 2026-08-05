"""
ILDLM Framework - Cryptographic Document Hasher
Module: blockchain_integration/hasher.py
"""

import hashlib
import json
from typing import Dict, Any

class DocumentHasher:
    """
    Computes cryptographic signatures and SHA-256 hashes of legal documents
    and extracted clause metadata to ensure non-repudiation and document integrity.
    """

    @staticmethod
    def hash_text(text: str) -> str:
        """Computes SHA-256 hash of raw document text."""
        cleaned = text.strip().encode('utf-8')
        return hashlib.sha256(cleaned).hexdigest()

    @staticmethod
    def hash_metadata(metadata: Dict[str, Any]) -> str:
        """Computes SHA-256 hash of structured JSON metadata."""
        dumped = json.dumps(metadata, sort_keys=True).encode('utf-8')
        return hashlib.sha256(dumped).hexdigest()

    @staticmethod
    def generate_proof(text: str, metadata: Dict[str, Any]) -> Dict[str, str]:
        """Generates a complete dual-hash integrity proof."""
        doc_hash = DocumentHasher.hash_text(text)
        meta_hash = DocumentHasher.hash_metadata(metadata)
        combined = f"{doc_hash}:{meta_hash}".encode('utf-8')
        root_hash = hashlib.sha256(combined).hexdigest()

        return {
            "document_hash": f"0x{doc_hash}",
            "metadata_hash": f"0x{meta_hash}",
            "merkle_root_proof": f"0x{root_hash}"
        }
