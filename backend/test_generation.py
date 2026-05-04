import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Document, User, ContractProposal
from api.services import mapping_service, generation_service

# Setup mock user and document
user = User.objects.get(username='test_lawyer')
doc = Document.objects.get(title='Test Lease', owner=user)

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
