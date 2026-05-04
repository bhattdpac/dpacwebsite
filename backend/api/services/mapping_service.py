import re
from typing import Optional, Dict, Any
from api.models import SmartContractTemplate, ContractProposal, Clause, Document

def suggest_templates(document: Document) -> Optional[ContractProposal]:
    """
    Scans approved clauses of a document and suggests smart contract templates.
    """
    approved_clauses = document.clauses.filter(is_approved=True)
    if not approved_clauses.exists():
        return None

    # Default to BaseLegalContract for any document
    base_template = SmartContractTemplate.objects.filter(contract_name='BaseLegalContract').first()
    
    # Check for specific clause types
    proposals = []
    
    # 1. Payment Mapping
    payment_clause = approved_clauses.filter(type='PAYMENT').first()
    if payment_clause:
        template = SmartContractTemplate.objects.filter(contract_name='PaymentEscrow').first()
        if template:
            params = extract_payment_params(payment_clause)
            proposals.append({
                'template': template,
                'parameters': params
            })

    # 2. Termination Mapping
    term_clause = approved_clauses.filter(type='TERMINATION').first()
    if term_clause:
        template = SmartContractTemplate.objects.filter(contract_name='TerminationLogic').first()
        if template:
            params = extract_termination_params(term_clause)
            proposals.append({
                'template': template,
                'parameters': params
            })

    # For the MVP, we pick the most "complex" template or default to Base
    if proposals:
        # Sort by some priority if needed, for now just pick the first match
        best_match = proposals[0]
        proposal, created = ContractProposal.objects.update_or_create(
            document=document,
            defaults={
                'template': best_match['template'],
                'parameters': best_match['parameters']
            }
        )
        return proposal
    
    # Fallback to BaseLegalContract
    if base_template:
        proposal, created = ContractProposal.objects.update_or_create(
            document=document,
            defaults={
                'template': base_template,
                'parameters': {
                    'docHash': '0x' + '0' * 64, # Placeholder
                    'docURI': document.file.url
                }
            }
        )
        return proposal

    return None

def extract_payment_params(clause: Clause) -> Dict[str, Any]:
    """
    Extracts amount and addresses from a payment clause.
    Uses basic regex for now; in a real app, use spaCy entities.
    """
    text = clause.text
    params = {
        'totalAmount': "1000000000000000000", # Default 1 ETH in wei
        'payer': "0x0000000000000000000000000000000000000000",
        'payee': "0x0000000000000000000000000000000000000000"
    }

    # Extract amount (simple digits)
    amount_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:ETH|ether|dollars|USD)', text, re.IGNORECASE)
    if amount_match:
        # Convert to wei (assuming ETH for simplicity)
        try:
            val = float(amount_match.group(1))
            params['totalAmount'] = str(int(val * 10**18))
        except:
            pass

    return params

def extract_termination_params(clause: Clause) -> Dict[str, Any]:
    """
    Extracts duration from a termination clause.
    """
    text = clause.text
    params = {'durationDays': 30}
    
    days_match = re.search(r'(\d+)\s*days', text, re.IGNORECASE)
    if days_match:
        params['durationDays'] = int(days_match.group(1))
        
    return params
