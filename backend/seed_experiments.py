import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Experiment, ResearchLog

experiments = [
    {
        'title': 'Vulnerability Auditing and Generation of Legal Smart Contracts using Low-Resource LLM execution (AirLLM)',
        'goal': 'Investigate compiling natural-language legal clauses into Solidity templates and running security evaluations (like Slither) locally using large-scale language models executed via Gavin Li\'s AirLLM layer-by-layer framework.',
        'dataset': '50 custom NDAs and Loan templates',
        'model_details': 'AirLLM + LLaMA-3-70B-Instruct (4-bit quantized)',
        'metrics': {
            'accuracy': 0.91,
            'vram_required': '4GB',
            'avg_latency_seconds': 12.5,
            'slither_success_rate': '100%'
        },
        'observations': 'Sequence loading of model layers layer-by-layer allows running 70B parameter models on low-VRAM GPUs. Quantization improves inference speed without compromising clause parameter parsing correctness. Slither checks confirm compiled Solidity is reentrancy-free.',
        'future_work': 'Optimize flash-attention layer loading inside the AirLLM model runner configuration.'
    },
    {
        'title': 'Intelligent Bias and Gender Pronoun Auditing in Legal Agreements',
        'goal': 'Assess natural language agreements for gendered bias, unilateral discretion phrasing, and contract power imbalances before smart contract template selection.',
        'dataset': '120 standard lease agreements and procurement contracts',
        'model_details': 'spaCy custom NLP pipeline + Named Entity Recognition',
        'metrics': {
            'precision': 0.88,
            'recall': 0.86,
            'f1_score': 0.87
        },
        'observations': 'Successfully flagged gendered terminology and notices of absolute discretion. Integrating these checks lowers downstream contract compliance risks and ensures ethical transparency.',
        'future_work': 'Map localized Hindi and bilingual legal templates to the pipeline model.'
    },
    {
        'title': 'Court Judgment Prediction and Explanation (CJPE) on Indian Supreme Court ILDC Corpus',
        'goal': 'Train and evaluate baseline models (Legal-BERT, RoBERTa) on the Indian Legal Documents Corpus to predict appeal decisions (granted vs denied) and extract salient rationales.',
        'dataset': 'ILDC (35,000 Supreme Court of India case documents)',
        'model_details': 'Hierarchical Occlusion Model + law-ai/InLegalBERT',
        'metrics': {
            'accuracy': 0.78,
            'precision': 0.76,
            'recall': 0.75,
            'f1_score': 0.755
        },
        'observations': 'Compared models to human legal experts (94% accuracy). Found that while text classification baseline yields solid predictions, explainability metrics require additional structured reasoning graphs to match expert lawyer annotations.',
        'future_work': 'Combine smart contract generation mapping with CJPE precedents to recommend dispute resolution templates.'
    }
]

for exp in experiments:
    Experiment.objects.update_or_create(
        title=exp['title'],
        defaults=exp
    )

logs = [
    {
        'week_number': 6,
        'date': date(2026, 8, 5),
        'achievements': 'Evaluated AirLLM open-source library for running 70B models locally on a 4GB GPU VPS node to bypass cloud API expenses. Redesigned frontend to make modular topology interactive and mapped dynamic progress bars directly to the Uttaranchal University PhD synopsis objectives.',
        'blockers': 'Inference latency remains high due to sequential layer loading from disk; examining high-performance SSD caching options.',
        'next_goals': 'Perform empirical efficiency measurements to calculate cost reduction metrics under Objective 4.'
    },
    {
        'week_number': 5,
        'date': date(2026, 7, 29),
        'achievements': 'Implemented custom fairness check module in the NLP engine to identify gendered language and notice period imbalances. Configured PostgreSQL database engine for production deployment.',
        'blockers': 'Hardhat blockchain local nodes encountered brief stability errors during gunicorn service daemonization.',
        'next_goals': 'Write automated deploy automation script for VPS environment setups.'
    }
]

for log in logs:
    ResearchLog.objects.update_or_create(
        week_number=log['week_number'],
        defaults=log
    )

print("Experiments and Weekly Logs seeded successfully.")
