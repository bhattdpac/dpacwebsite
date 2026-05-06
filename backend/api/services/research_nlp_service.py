import fitz  # PyMuPDF
import re

def extract_sections(file_path):
    """
    Extracts Abstract, Methodology, and Findings from a research paper PDF.
    Uses heuristic section detection based on common academic headers.
    """
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        
        sections = {
            'abstract': '',
            'methodology': '',
            'findings': ''
        }

        # Heuristic patterns for section headers
        patterns = {
            'abstract': r'(?i)abstract[\s\n]+([\s\S]+?)(?=\n(?:1\.?\s+)?(?:introduction|intro)|$)',
            'methodology': r'(?i)(?:methodology|methods|experimental\s+setup)[\s\n]+([\s\S]+?)(?=\n(?:3\.?\s+)?(?:results|findings|discussion)|$)',
            'findings': r'(?i)(?:results|findings|discussion)[\s\n]+([\s\S]+?)(?=\n(?:4\.?\s+)?(?:conclusion|summary|references)|$)'
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, text)
            if match:
                sections[key] = match.group(1).strip()
            else:
                # Fallback: find the header and take the next few paragraphs
                header_match = re.search(fr'(?i){key}', text)
                if header_match:
                    start = header_match.end()
                    sections[key] = text[start:start+500].strip() + "..."
                else:
                    sections[key] = f"Could not automatically extract {key}. Section not clearly labeled."

        return sections

    except Exception as e:
        print(f"Research NLP Error: {str(e)}")
        return {
            'abstract': 'Error processing document.',
            'methodology': 'Error processing document.',
            'findings': 'Error processing document.'
        }
