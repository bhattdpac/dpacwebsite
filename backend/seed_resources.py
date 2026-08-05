import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Course, Resource

courses = [
    {
        'title': 'Blockchain Technology and Smart Contracts',
        'code': 'UU-CS-501',
        'description': 'An advanced postgraduate course covering cryptography, distributed ledgers, consensus mechanisms, and writing secure Solidity smart contracts using Hardhat and Remix.',
        'resource_links': [
            {'name': 'Lecture Slides: Reentrancy Exploits', 'url': 'https://github.com/bhattdpac/dpacwebsite/tree/master/docs/lecture_reentrancy.pdf'},
            {'name': 'Lab Manual: Gas Optimization', 'url': 'https://github.com/bhattdpac/dpacwebsite/tree/master/docs/lab_gas_optimization.pdf'}
        ]
    },
    {
        'title': 'Natural Language Processing in Legal-Tech',
        'code': 'UU-CS-502',
        'description': 'Covers tokenization, POS tagging, dependency parsing, bias auditing, and fine-tuning transformers using HuggingFace and spaCy for legal agreement structure mapping.',
        'resource_links': [
            {'name': 'Python Notebook: Bias Auditing Pipeline', 'url': 'https://github.com/bhattdpac/dpacwebsite/tree/master/notebooks/bias_audit.ipynb'}
        ]
    }
]

for c in courses:
    Course.objects.update_or_create(
        code=c['code'],
        defaults=c
    )

resources = [
    {
        'title': 'Jupyter Notebook: spaCy Bias Auditor for Legal Agreements',
        'description': 'A pre-configured Jupyter notebook to reproduce bias assessment in lease agreements and NDAs as outlined in Objective 3 of the Uttaranchal University synopsis.',
        'file_type': 'Jupyter Notebook (.ipynb)',
        'file_url': 'https://raw.githubusercontent.com/bhattdpac/dpacwebsite/master/notebooks/bias_audit.ipynb',
        'downloads_count': 34
    },
    {
        'title': 'Uttaranchal University PhD Synopsis - Submission Document',
        'description': 'Original approved thesis proposal: \'Implementing Smart Contracts Using Blockchain Technology for Secure and Transparent Legal Documentation\' (Deepak Bhatt).',
        'file_type': 'PDF Document',
        'file_url': 'https://raw.githubusercontent.com/bhattdpac/dpacwebsite/master/docs/UU_Synopsis_Deepak_Bhatt.pdf',
        'downloads_count': 142
    }
]

for r in resources:
    Resource.objects.update_or_create(
        title=r['title'],
        defaults=r
    )

print("Academy and Downloads Resources seeded successfully.")
