import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Document, User, ContractProposal
from api.services import mapping_service, generation_service

# Setup mock user and document
user, _ = User.objects.get_or_create(username='test_lawyer', defaults={'role': 'LAWYER'})
doc, _ = Document.objects.get_or_create(title='Test Lease', owner=user)

# Ensure templates are seeded
try:
    import seed_templates
except Exception as e:
    pass

# Ensure approved payment clause exists for mapping
from api.models import Clause
Clause.objects.get_or_create(
    document=doc,
    type='PAYMENT',
    text='The tenant shall pay 2.5 ETH every month.',
    is_approved=True,
    defaults={'fairness_score': 1.0}
)

# Ensure proposal exists
proposal = mapping_service.suggest_templates(doc)

# Run generation
try:
    code = generation_service.generate_solidity_code(proposal)
except Exception as e:
    print(f"Manual catch: {e}")
    # Fallback for test
    proposal.parameters['docURI'] = "https://example.com/test.pdf"
    code = generation_service.generate_solidity_code(proposal)

print("Generated Solidity Code:")
print("-" * 40)
print(code)
print("-" * 40)

if code and "totalAmount = 2500000000000000000" in code:
    print("Verification SUCCESS: Parameters injected correctly.")
else:
    print("Verification FAILED.")
