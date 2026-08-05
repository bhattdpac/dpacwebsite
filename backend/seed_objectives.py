import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import ResearchObjective

objectives = [
    {
        'num': '01',
        'title': 'Theory & Principles',
        'description': 'Investigate the core principles of smart contracts and blockchain technology, focusing on their application in legal documentation.',
        'progress_percentage': 90,
        'status': 'IN_PROGRESS'
    },
    {
        'num': '02',
        'title': 'Security Auditing',
        'description': 'Evaluate the security features of blockchain that ensure the integrity and transparency of smart contracts, enhancing their reliability for legal purposes.',
        'progress_percentage': 75,
        'status': 'IN_PROGRESS'
    },
    {
        'num': '03',
        'title': 'Framework Design',
        'description': 'Design and propose a comprehensive framework for implementing smart contracts in legal documentation, addressing technical and practical aspects.',
        'progress_percentage': 60,
        'status': 'IN_PROGRESS'
    },
    {
        'num': '04',
        'title': 'Empirical Evaluation',
        'description': 'Measure the effectiveness of smart contracts in reducing costs, improving efficiency, and minimizing fraud in legal documentation processes.',
        'progress_percentage': 40,
        'status': 'IN_PROGRESS'
    }
]

for obj in objectives:
    ResearchObjective.objects.update_or_create(
        num=obj['num'],
        defaults=obj
    )

print("Research objectives seeded successfully.")
