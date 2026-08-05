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
    },
    {
        'title': 'ILDC for CJPE: Indian Legal Documents Corpus for Court Judgment Prediction and Explanation',
        'authors': 'Vijit Malik, Rishabh Sanjay, Shubham Kumar Nigam, Kripabandhu Ghosh, Shouvik Kumar Guha, Arnab Bhattacharya, Ashutosh Modi',
        'venue': 'Proceedings of the 59th Annual Meeting of the Association for Computational Linguistics (ACL-IJCNLP)',
        'year': 2021,
        'abstract': 'This work introduces the Indian Legal Documents Corpus (ILDC), a dataset of 35k Indian Supreme Court cases annotated with original court decisions and gold standard explanations by legal experts, proposing the task of Court Judgment Prediction and Explanation (CJPE).',
        'status': 'PUBLISHED',
        'doi': '10.18653/v1/2021.acl-long.313',
        'citation': 'Malik, V., Sanjay, R., Nigam, S. K., Ghosh, K., Guha, S. K., Bhattacharya, A., & Modi, A. (2021). ILDC for CJPE: Indian Legal Documents Corpus for Court Judgment Prediction and Explanation. Proceedings of the 59th ACL-IJCNLP, 4046–4062.'
    },
    {
        'title': 'Named Entity Recognition in Indian Court Judgments',
        'authors': 'Prathamesh Kalamkar, Astha Agarwal, Aman Tiwari, Smita Gupta, Saurabh Karn, Vivek Raghavan',
        'venue': 'Proceedings of the Natural Legal Language Processing Workshop 2022 (NLLP 2022)',
        'year': 2022,
        'abstract': 'This paper introduces a corpus of 46,545 annotated legal named entities mapped to 14 fine-grained Indian legal entity types (e.g. COURT, LAWYER, STATUTE, PRECEDENT), releasing the OpenNyAI pipeline baseline model for structured Indian case parsing.',
        'status': 'PUBLISHED',
        'doi': '10.18653/v1/2022.nllp-1.15',
        'citation': 'Kalamkar, P., Agarwal, A., Tiwari, A., Gupta, S., Karn, S., & Raghavan, V. (2022). Named Entity Recognition in Indian Court Judgments. Proceedings of the ACL Natural Legal Language Processing Workshop 2022, 184–193.'
    }
]

for pub in publications:
    Publication.objects.update_or_create(
        title=pub['title'],
        defaults=pub
    )

print("Publications seeded successfully.")
