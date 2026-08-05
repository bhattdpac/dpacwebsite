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

import sqlite3
import os

def get_related_papers(abstract_text, limit=3):
    """
    Queries the arxiv_index.db database to find similar papers based on abstract terms.
    Uses basic keyword extraction (filtering common stop words) and matches them in the title/abstract.
    """
    db_path = "/root/dpacwebsite/backend/arxiv_index.db"
    if not os.path.exists(db_path) or not abstract_text:
        return []

    # Simple tokenization & stop-words filtering
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "of", "is", "are", "was", "were", "this", "that", "these", "those", "we", "they", "our", "their", "results", "paper", "study", "analysis", "proposed"}
    words = re.findall(r'\b[a-zA-Z]{4,15}\b', abstract_text.lower())
    keywords = [w for w in words if w not in stop_words]
    
    if not keywords:
        return []

    # Count frequencies and take top 5 keywords
    from collections import Counter
    top_keywords = [item[0] for item in Counter(keywords).most_common(5)]
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Build query matching any of the top keywords
    query = "SELECT id, title, authors, categories, abstract FROM arxiv_papers WHERE "
    conditions = []
    params = []
    for kw in top_keywords:
        conditions.append("(title LIKE ? OR abstract LIKE ?)")
        params.extend([f"%{kw}%", f"%{kw}%"])
    
    query += " OR ".join(conditions)
    query += " LIMIT ?"
    params.append(limit)
    
    results = []
    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        for row in rows:
            results.append({
                "id": row[0],
                "title": row[1],
                "authors": row[2],
                "categories": row[3],
                "abstract": row[4]
            })
        print(f"arXiv Lookup found {len(results)} matches for keywords: {top_keywords}")
    except Exception as e:
        print("Error querying arXiv index:", e)
    finally:
        conn.close()
        
    return results


def get_related_cases(abstract_text, limit=3):
    """
    Queries the arxiv_index.db database to find similar Australian Federal Court cases
    based on keywords from the paper/abstract text.
    """
    db_path = "/root/dpacwebsite/backend/arxiv_index.db"
    if not os.path.exists(db_path) or not abstract_text:
        return []

    # Simple tokenization & stop-words filtering
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "of", "is", "are", "was", "were", "this", "that", "these", "those", "we", "they", "our", "their", "results", "paper", "study", "analysis", "proposed", "legal", "court", "case", "judgment"}
    words = re.findall(r'\b[a-zA-Z]{4,15}\b', abstract_text.lower())
    keywords = [w for w in words if w not in stop_words]
    
    if not keywords:
        return []

    # Count frequencies and take top 5 keywords
    from collections import Counter
    top_keywords = [item[0] for item in Counter(keywords).most_common(5)]
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Build query matching any of the top keywords on name, catchphrases, or summary
    query = "SELECT id, name, austlii_url, catchphrases, summary FROM legal_cases WHERE "
    conditions = []
    params = []
    for kw in top_keywords:
        conditions.append("(name LIKE ? OR catchphrases LIKE ? OR summary LIKE ?)")
        params.extend([f"%{kw}%", f"%{kw}%", f"%{kw}%"])
    
    query += " OR ".join(conditions)
    query += " LIMIT ?"
    params.append(limit)
    
    results = []
    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        for row in rows:
            results.append({
                "id": row[0],
                "name": row[1],
                "austlii_url": row[2],
                "catchphrases": row[3],
                "summary": row[4]
            })
        print(f"Legal Cases Lookup found {len(results)} matches for keywords: {top_keywords}")
    except Exception as e:
        print("Error querying legal cases index:", e)
    finally:
        conn.close()
        
    return results

