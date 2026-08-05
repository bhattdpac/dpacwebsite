import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

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
    },
    {
        'name': 'Confidentiality NDA',
        'contract_name': 'ConfidentialityNDA',
        'description': 'Non-Disclosure Agreement hash registry with term duration.',
        'required_params': ['docHash', 'docURI', 'disclosingParty', 'receivingParty', 'termDuration'],
        'sol_path': 'blockchain/contracts/templates/ConfidentialityNDA.sol'
    },
    {
        'name': 'Secured Loan',
        'contract_name': 'SecuredLoan',
        'description': 'Loan agreement with collateral locking and default tracking.',
        'required_params': ['docHash', 'docURI', 'lender', 'borrower', 'loanAmount', 'interestRate', 'repaymentDeadline'],
        'sol_path': 'blockchain/contracts/templates/SecuredLoan.sol'
    }
]

for t in templates:
    SmartContractTemplate.objects.update_or_create(
        contract_name=t['contract_name'],
        defaults=t
    )
print("Templates seeded successfully.")
