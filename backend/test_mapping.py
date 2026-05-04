from api.models import Document, Clause, SmartContractTemplate, User
from api.services import mapping_service

# Setup mock user and document
user, _ = User.objects.get_or_create(username='test_lawyer')
doc, _ = Document.objects.get_or_create(title='Test Lease', owner=user)

# Add approved clauses
Clause.objects.get_or_create(
    document=doc,
    type='PAYMENT',
    text='The tenant shall pay 2.5 ETH every month.',
    is_approved=True
)
Clause.objects.get_or_create(
    document=doc,
    type='TERMINATION',
    text='The agreement terminates after 90 days.',
    is_approved=True
)

# Run mapping
proposal = mapping_service.suggest_templates(doc)

print(f"Proposal generated: {proposal}")
if proposal:
    print(f"Template: {proposal.template.contract_name}")
    print(f"Parameters: {proposal.parameters}")
