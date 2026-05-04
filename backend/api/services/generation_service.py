import os
from jinja2 import Template
from django.conf import settings
from typing import Optional, Dict, Any
from ..models import ContractProposal, SmartContractTemplate

def generate_solidity_code(proposal: ContractProposal) -> Optional[str]:
    """
    Generates customized Solidity code for a ContractProposal.
    """
    template_obj = proposal.template
    if not template_obj:
        return None

    # Determine paths
    # sol_path in DB is 'blockchain/contracts/templates/...'
    # We need to find the .j2 version
    j2_path = os.path.join(settings.BASE_DIR, '..', template_obj.sol_path + '.j2')
    
    if not os.path.exists(j2_path):
        # Try relative to backend just in case
        j2_path = os.path.join(settings.BASE_DIR, template_obj.sol_path + '.j2')
    
    if not os.path.exists(j2_path):
        # Final fallback: root of workspace
        j2_path = os.path.join(settings.BASE_DIR, '..', template_obj.sol_path + '.j2')

    try:
        with open(j2_path, 'r') as f:
            j2_content = f.read()
        
        # Add default params if missing
        params = proposal.parameters.copy()
        if 'docHash' not in params:
            # Generate a mock hash for now or use document title
            import hashlib
            doc_hash = hashlib.sha256(proposal.document.title.encode()).hexdigest()
            params['docHash'] = '0x' + doc_hash
        
        if 'docURI' not in params:
            try:
                params['docURI'] = proposal.document.file.url
            except ValueError:
                params['docURI'] = "#"

        # Render with Jinja2
        template = Template(j2_content)
        generated_code = template.render(**params)
        
        # Generate Client Explanation
        explanation = generate_client_explanation(template_obj, params)
        
        # Save to proposal
        proposal.generated_code = generated_code
        proposal.client_explanation = explanation
        proposal.is_ready_for_deployment = True
        proposal.save()
        
        return generated_code
    except Exception as e:
        print(f"Code Generation Error: {str(e)}")
        return None

def generate_client_explanation(template: SmartContractTemplate, params: Dict[str, Any]) -> str:
    """
    Translates Solidity template logic and parameters into plain language.
    """
    name = template.contract_name
    
    if name == 'PaymentEscrow':
        amount_eth = float(params.get('totalAmount', 0)) / 10**18
        return (
            f"This contract acts as a secure digital safe. The payer ({params.get('payer')}) "
            f"will deposit {amount_eth} ETH into this contract. The funds will be held securely "
            f"on the blockchain and will only be released to the payee ({params.get('payee')}) "
            f"once the lawyer (contract owner) confirms that the legal milestones have been met."
        )
    
    if name == 'TerminationLogic':
        days = params.get('durationDays', 30)
        return (
            f"This contract has a built-in expiration date. It will remain active for {days} days "
            f"from the moment it is deployed. After this period, or if the lawyer manually "
            f"terminates it earlier (e.g., due to a breach), the contract's primary functions will be locked."
        )
    
    return (
        "This is a fundamental legal registry contract. It stores a digital fingerprint (hash) "
        "of your document on the blockchain, providing an immutable record that the document "
        "existed in this exact form at the time of deployment."
    )
