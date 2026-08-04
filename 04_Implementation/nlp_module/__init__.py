"""
NLP Module for ILDLM Legal Document Processing Framework
"""

from .extractor import LegalExtractor
from .parser import LegalParser
from .utils import clean_text, split_into_clauses, extract_regex_entities

__all__ = ["LegalExtractor", "LegalParser", "clean_text", "split_into_clauses", "extract_regex_entities"]
