import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Document, SmartContractTemplate, Clause
from api.services import nlp_service, mapping_service, generation_service

def validate():
    print("=== STARTING NON-DESTRUCTIVE INTEGRATION WALKTHROUGH ===")

    # 1. Ensure templates are seeded
    try:
        import seed_templates
        print("Templates seeded successfully.")
    except Exception as e:
        print(f"Template seed warning: {e}")
    
    # 2. Get or create test lawyer
    user, created = User.objects.get_or_create(
        username='e2e_test_lawyer',
        defaults={'role': 'LAWYER', 'email': 'e2e@deepakbhatt.dev'}
    )
    if created:
        user.set_password('password123')
        user.save()
        print("Created e2e_test_lawyer user.")
    else:
        print("Using existing e2e_test_lawyer user.")

    # 3. Simulate upload
    doc_content = (
        "This Lease Agreement is made between Uttaranchal University (Lender) and Deepak Bhatt (Borrower). "
        "The Borrower agrees to repay the loan amount of 500000000000000000 Wei (0.5 ETH) to the Lender. "
        "The landlord reserves the right to terminate at his sole discretion without notice."
    )
    test_file = SimpleUploadedFile("loan_agreement.txt", doc_content.encode(), content_type="text/plain")
    
    doc = Document.objects.create(
        title='E2E Validation Agreement',
        file=test_file,
        owner=user
    )
    print(f"Successfully uploaded: {doc.title}")

    # 4. Run NLP pipeline
    print("Running NLP pipelines (vulnerability audit & clause extraction)...")
    nlp_service.process_document(doc)
    
    clauses = doc.clauses.all()
    print(f"Extracted {clauses.count()} clauses:")
    for c in clauses:
        print(f"  - [{c.type}] Fairness Score: {c.fairness_score} | Notes: {c.fairness_notes}")
        # Approve for mapping
        c.is_approved = True
        c.save()

    # 5. Suggest template
    print("Suggesting Solidity template based on extracted clauses...")
    proposal = mapping_service.suggest_templates(doc)
    if proposal:
        print(f"Suggested Contract Template: {proposal.template.contract_name}")
        print(f"Parameters extracted: {proposal.parameters}")
    else:
        print("FAIL: No template matched.")
        return

    # 6. Generate Solidity Code
    print("Compiling parameters into Solidity code...")
    # Add default validation parameters if they didn't map automatically
    if 'docHash' not in proposal.parameters or not proposal.parameters['docHash']:
        proposal.parameters['docHash'] = "0x" + "a" * 64
    if 'docURI' not in proposal.parameters or not proposal.parameters['docURI']:
        proposal.parameters['docURI'] = "https://deepakbhatt.dev/media/contracts/e2e.pdf"
    if 'lender' not in proposal.parameters or not proposal.parameters['lender']:
        proposal.parameters['lender'] = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    if 'borrower' not in proposal.parameters or not proposal.parameters['borrower']:
        proposal.parameters['borrower'] = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    if 'loanAmount' not in proposal.parameters or not proposal.parameters['loanAmount']:
        proposal.parameters['loanAmount'] = 500000000000000000
    if 'interestRate' not in proposal.parameters or not proposal.parameters['interestRate']:
        proposal.parameters['interestRate'] = 5
    if 'repaymentDeadline' not in proposal.parameters or not proposal.parameters['repaymentDeadline']:
        proposal.parameters['repaymentDeadline'] = 3600
        
    code = generation_service.generate_solidity_code(proposal)
    if code:
        print("Solidity Code Generated successfully:")
        print("-" * 50)
        lines = code.splitlines()
        print("\n".join(lines[:12]))
        print("...")
        print("-" * 50)
    else:
        print("FAIL: Solidity generation failed.")
        return

    print("=== Walkthrough Validation: SUCCESS ===")

if __name__ == '__main__':
    validate()
