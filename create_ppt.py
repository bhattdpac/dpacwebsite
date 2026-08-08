from pptx import Presentation
from pptx.util import Inches, Pt
import os

template_path = '/root/dpacwebsite/uuformat.pptx'
output_path = '/root/dpacwebsite/RDC_Presentation.pptx'

prs = Presentation(template_path)

# Slide 1: Title
title_slide_layout = prs.slide_layouts[0]
slide = prs.slides.add_slide(title_slide_layout)
title = slide.shapes.title
subtitle = slide.placeholders[1]
title.text = "A Human-Centered Framework for Translating Legal Documents to Secure Smart Contracts"
subtitle.text = "Deepak Bhatt\nComputer Science & Engineering\nUttaranchal University"

# Helper to add a slide
def add_slide(title_text, bullet_points):
    try:
        bullet_slide_layout = prs.slide_layouts[1]
    except IndexError:
        # Fallback if no layout 1
        bullet_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(bullet_slide_layout)
    shapes = slide.shapes
    try:
        title_shape = shapes.title
        title_shape.text = title_text
    except Exception:
        pass
    
    try:
        # Find the body placeholder
        body_shape = None
        for shape in slide.placeholders:
            if shape.placeholder_format.idx == 1:
                body_shape = shape
                break
        if not body_shape and len(slide.placeholders) > 1:
            body_shape = slide.placeholders[1]
        
        if body_shape:
            tf = body_shape.text_frame
            tf.text = bullet_points[0]
            for bullet in bullet_points[1:]:
                p = tf.add_paragraph()
                p.text = bullet
    except Exception:
        pass

# Slide 2: The Research Problem
add_slide("The Research Problem", [
    "Semantic disconnect between traditional legal prose and deterministic code.",
    "High technical barrier preventing legal professionals from authoring smart contracts.",
    "Unilateral execution of code often ignores human-centric nuances (e.g., fairness, bias).",
    "High risk of vulnerabilities resulting from manual, ad-hoc smart contract coding."
])

# Slide 3: Motivation
add_slide("Motivation", [
    "Rapid adoption of decentralized finance (DeFi) and automated legal agreements.",
    "Escalating financial losses due to logic flaws in smart contract code.",
    "Regulatory demands for explainable automated systems.",
    "Need to empower domain experts (lawyers) rather than relying solely on software engineers."
])

# Slide 4: The Research Gap
add_slide("The Research Gap", [
    "Existing parsers focus solely on parameter extraction, ignoring clause fairness.",
    "Current automated generators lack verifiable, secure base templates.",
    "Absence of a cohesive, human-in-the-loop review mechanism prior to deployment.",
    "Missing integration of automated bias auditing within the smart contract compilation pipeline."
])

# Slide 5: Core Aim
add_slide("Core Aim", [
    "To systematically translate natural language legal texts into executable, secure, and transparent smart contracts while preserving human-in-the-loop oversight and fairness."
])

# Slide 6: Research Objectives & Status
add_slide("Research Objectives & Status", [
    "Objective 1: Investigate smart contract principles for legal docs. (Completed)",
    "Objective 2: Evaluate security features (integrity, audit trails). (Completed)",
    "Objective 3: Propose comprehensive framework implementation. (Completed - Prototype Live)",
    "Objective 4: Measure framework effectiveness (time/cost metrics). (In Progress - Empirical Phase)"
])

# Slide 7: Proposed Framework
add_slide("Proposed Framework", [
    "Phase 1: Ingestion & Analysis - NLP parsing of unilateral and bilateral clauses.",
    "Phase 2: The Collaborative Workspace - Plain-language translation and fairness warnings.",
    "Phase 3: Secure Compilation - Parameter mapping to verified architectural templates.",
    "Phase 4: Blockchain Deployment - Automated testing and on-chain execution."
])

# Slide 8: System Architecture
add_slide("System Architecture", [
    "Tier 1 (Intelligent Document Module): Python/spaCy environment for entity extraction and linguistic bias detection.",
    "Tier 2 (Generation Engine): Jinja2 templating system matching approved parameters to modular Solidity blueprints.",
    "Tier 3 (Blockchain Integration): Hardhat environment managing automated compilation, deployment, and audit trail logging."
])

# Slide 9: Methodology
add_slide("Methodology", [
    "Approach: Design Science Research (DSR) methodology.",
    "Iterative Prototyping: Continuous refinement based on security static analysis and user feedback.",
    "Data Sources: Synthesized unilateral lease agreements and escrow contracts for baseline testing.",
    "Validation Strategy: Combining computational static analysis with empirical human-centric trials."
])

# Slide 10: Intelligent Document Module
add_slide("Intelligent Document Module", [
    "Contextual Parsing: Identification of entities (e.g., Payer, Payee, Value).",
    "Bias Detection: Flagging gendered pronouns and unilateral power imbalances.",
    "Fairness Scoring: Quantitative assessment of clause equity.",
    "Client Explainability: Translating complex legalese into plain-language warnings."
])

# Slide 11: Secure Smart Contract Generation
add_slide("Secure Smart Contract Generation", [
    "Template-Based Paradigm: Utilizing predefined .j2 blueprints.",
    "Inheritance Model: All templates inherit from BaseLegalContract.sol.",
    "Parameter Injection: Deterministic mapping of NLP variables directly to contract state variables.",
    "Fallback Mechanisms: System defaults to human review for any partial linguistic matches."
])

# Slide 12: Security Validation Protocol
add_slide("Security Validation Protocol", [
    "Static Analysis: Integration with slither-analyzer to detect reentrancy.",
    "Unit Testing: 14 Hardhat test suites validating state transitions.",
    "Access Control: Implementation of Role-Based Access Control (RBAC).",
    "Auditability: Immutable logging of the human approval process prior to contract generation."
])

# Slide 13: Experimental Evaluation
add_slide("Experimental Evaluation", [
    "Computational Metrics: Gas optimization, deployment latency, and static analysis success rates.",
    "NLP Accuracy: Precision and recall metrics for entity extraction and bias flagging.",
    "Empirical Testing: Assessing time-to-deployment compared to traditional manual drafting.",
    "User Interpretability: Measuring legal professional comprehension of the generated audit reports."
])

# Slide 14: Current Results
add_slide("Current Results", [
    "Prototype Deployment: End-to-end framework live on the Virtual Private Server (VPS).",
    "Security Clearances: All 14 foundational smart contract tests passing with zero vulnerabilities.",
    "NLP Validation: Successful identification of unilateral clauses in test lease agreements.",
    "System Integration: Flawless state transfer from the Django/spaCy backend to Hardhat."
])

# Slide 15: Research Contributions
add_slide("Research Contributions", [
    "Theoretical: A novel human-centric framework mapping legal prose to deterministic state machines.",
    "Methodological: Introduction of automated fairness and bias auditing in the smart contract pipeline.",
    "Practical: An end-to-end prototype empowering legal professionals to utilize blockchain."
])

# Slide 16: Future Work
add_slide("Future Work", [
    "Immediate Steps: Conduct human-in-the-loop trials with domain experts.",
    "NLP Expansion: Broaden the training data to include complex, multi-party corporate agreements.",
    "System Optimization: Refine Jinja2 templates based on gas consumption analysis.",
    "Long-term Vision: Integration with decentralized identity (DID) verification protocols."
])

# Slide 17: Conclusion
add_slide("Conclusion", [
    "Smart contracts require both technical security and legal fairness.",
    "The proposed framework successfully integrates NLP auditing with secure template generation.",
    "Legal professionals are re-inserted into the technical loop, ensuring explainability.",
    "The system is currently stable and transitioning to final empirical evaluations."
])

try:
    prs.save(output_path)
    print("Presentation generated successfully at", output_path)
except Exception as e:
    print("Error generating presentation:", e)
