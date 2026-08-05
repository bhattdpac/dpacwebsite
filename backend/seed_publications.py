import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Publication

publications = [
    {
        'title': 'Implementing Smart Contracts Using Blockchain Technology for Secure and Transparent Legal Documentation',
        'authors': 'Deepak Bhatt, Amar Jeet Rawat',
        'venue': 'International Journal of Computer Applications',
        'year': 2024,
        'abstract': 'This paper investigates the application of blockchain smart contracts to improve the transparency and security of legal documentation, bridging the gap between natural language text and self-executing code.',
        'status': 'PUBLISHED',
        'doi': '10.1016/j.procs.2024.04.238',
        'citation': 'Bhatt, D., & Rawat, A. J. (2024). Implementing Smart Contracts Using Blockchain Technology for Secure and Transparent Legal Documentation. International Journal of Computer Applications.'
    },
    {
        'title': 'Fairness and Bias Audits in Natural Language Processing Pipelines for Smart Contract Mapping',
        'authors': 'Deepak Bhatt, Amar Jeet Rawat',
        'venue': 'IEEE Transactions on Software Engineering',
        'year': 2025,
        'abstract': 'This study proposes a framework for auditing gender bias and power imbalances in natural language agreements before compiling them into Solidity smart contracts.',
        'status': 'UNDER_REVIEW',
        'doi': '10.1109/TSE.2025.35232',
        'citation': 'Bhatt, D., & Rawat, A. J. (2025). Fairness and Bias Audits in Natural Language Processing Pipelines for Smart Contract Mapping. IEEE Transactions on Software Engineering (Under Review).'
    }
]

for pub in publications:
    Publication.objects.update_or_create(
        title=pub['title'],
        defaults=pub
    )

print("Publications seeded successfully.")
