import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import Document, User, Clause, SmartContractTemplate
from api.services import nlp_service, mapping_service, generation_service

def run_demo():
    print("--- Starting PhD Framework Demonstration ---")
    
    # 1. Setup Data
    User.objects.all().delete()
    Document.objects.all().delete()
    SmartContractTemplate.objects.all().delete()
    
    user = User.objects.create_user(username='demo_lawyer', password='password', role='LAWYER')
    
    # Initialize Templates (Mocking what would be in the DB)
    base = SmartContractTemplate.objects.create(
        name='Base Legal Contract',
        contract_name='BaseLegalContract',
        description='Base contract for all legal docs',
        sol_path='blockchain/contracts/templates/BaseLegalContract.sol'
    )
    escrow = SmartContractTemplate.objects.create(
        name='Payment Escrow',
        contract_name='PaymentEscrow',
        description='Milestone based payment escrow',
        sol_path='blockchain/contracts/templates/PaymentEscrow.sol'
    )

    # 2. Upload Document (Simulating a lease with gendered and biased language)
    doc_content = (
        "The tenant shall pay 2.5 ETH monthly as rent to the landlord's wallet. "
        "He must ensure that he maintains the property in good condition. "
        "The landlord reserves the right to terminate this agreement at his sole discretion without notice."
    )
    test_file = SimpleUploadedFile("lease.txt", doc_content.encode(), content_type="text/plain")
    doc = Document.objects.create(title='Biased Lease Agreement', file=test_file, owner=user)
    
    print(f"Step 1: Document '{doc.title}' uploaded.")

    # 3. Trigger NLP Processing
    print("Step 2: Running NLP Clause Extraction & Fairness Audit...")
    nlp_service.process_document(doc)
    
    clauses = doc.clauses.all()
    print(f"   Found {clauses.count()} clauses.")
    for c in clauses:
        print(f"   - Identified: {c.type}")
        print(f"     Fairness Score: {c.fairness_score}/1.0")
        print(f"     Audit Notes: {c.fairness_notes}")
        # Approve the payment clause for mapping
        if c.type == 'PAYMENT':
            c.is_approved = True
            c.save()
            print("   - APPROVED Payment Clause for mapping.")

    # 4. Run Template Mapping
    print("Step 3: Mapping Clauses to Smart Contract Templates...")
    proposal = mapping_service.suggest_templates(doc)
    if proposal:
        print(f"   Suggested Template: {proposal.template.contract_name}")
        print(f"   Extracted Params: {proposal.parameters}")
    else:
        print("   FAILED to suggest template.")
        return

    # 5. Generate Solidity Code
    print("Step 4: Generating Solidity Code...")
    code = generation_service.generate_solidity_code(proposal)
    if code:
        print("   SUCCESS: Solidity code generated.")
        print("-" * 20)
        # Print first few lines of generated code
        print("\n".join(code.splitlines()[:15]))
        print("...")
        print("-" * 20)
    else:
        print("   FAILED to generate code.")
        return

    print("Step 5: Explainability Check...")
    print(f"   Plain-Language Explanation: {proposal.client_explanation}")

    print("\n--- Demonstration Complete ---")
    print("The system successfully translated human legal text into a secure, parameter-injected smart contract.")

if __name__ == "__main__":
    try:
        run_demo()
    except Exception as e:
        print(f"DEMO FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
