"""
ILDLM Framework - Interactive CLI & Processing Web App Entrypoint
Module: 04_Implementation/app.py
"""

import sys
import os
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from pipeline import ILDLMPipeline

def main():
    print("="*70)
    print("   INTELLIGENT LEGAL DOCUMENT LIFECYCLE MANAGEMENT (ILDLM)")
    print("   Ph.D. LegalTech & Smart Contract Automation Platform")
    print("="*70)
    
    pipeline = ILDLMPipeline()

    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        file_path = sys.argv[1]
        print(f"\n[+] Loading legal document from: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            doc_text = f.read()
    else:
        print("\n[+] No file argument provided. Running default sample contract pipeline...")
        doc_text = """
        SOFTWARE DEVELOPMENT SERVICE AGREEMENT
        
        This Agreement is made this 1st day of August, 2026, between
        TechCorp Solutions LLC ("Client") and AI Cybernetics Ltd ("Developer").
        
        1. SCOPE OF SERVICES
        The Developer shall design and deploy an AI-driven smart contract verification system.
        
        2. PAYMENT TERMS
        The Client shall pay USD 25,000 upon milestone completion within 15 days.
        If payment is delayed, a late fee penalty of 5% per month shall apply.
        
        3. JURISDICTION
        This agreement shall be governed by the laws of England and Wales.
        """

    result = pipeline.process_legal_document(doc_text)

    output_json_path = os.path.join(current_dir, "last_pipeline_output.json")
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    output_sol_path = os.path.join(current_dir, f"{result['solidity_contract']['contract_name']}.sol")
    with open(output_sol_path, "w", encoding="utf-8") as f:
        f.write(result['solidity_contract']['code'])

    print("\n[+] SUCCESS! Pipeline output written to artifacts:")
    print(f"    - Full Execution Output JSON: {output_json_path}")
    print(f"    - Generated Solidity Contract: {output_sol_path}")
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
