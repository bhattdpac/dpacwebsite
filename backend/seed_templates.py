from api.models import SmartContractTemplate

templates = [
    {
        'name': 'Base Legal Contract',
        'contract_name': 'BaseLegalContract',
        'description': 'Basic contract for storing document provenance on blockchain.',
        'required_params': ['docHash', 'docURI'],
        'sol_path': 'blockchain/contracts/templates/BaseLegalContract.sol'
    },
    {
        'name': 'Payment Escrow',
        'contract_name': 'PaymentEscrow',
        'description': 'Milestone-based payment handler with release/refund logic.',
        'required_params': ['docHash', 'docURI', 'payer', 'payee', 'totalAmount'],
        'sol_path': 'blockchain/contracts/templates/PaymentEscrow.sol'
    },
    {
        'name': 'Termination Logic',
        'contract_name': 'TerminationLogic',
        'description': 'Manages contract expiry and manual termination by authorized parties.',
        'required_params': ['docHash', 'docURI', 'durationDays'],
        'sol_path': 'blockchain/contracts/templates/TerminationLogic.sol'
    }
]

for t in templates:
    SmartContractTemplate.objects.update_or_create(
        contract_name=t['contract_name'],
        defaults=t
    )
print("Templates seeded successfully.")
