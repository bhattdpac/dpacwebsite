import os
import re
import sqlite3
import glob

DB_PATH = "/root/dpacwebsite/backend/arxiv_index.db"
CORPUS_DIR = "/root/dpacwebsite/corpus/fulltext"

def run_indexing():
    print("--- Starting Legal Case Reports Indexing ---")
    
    if not os.path.exists(CORPUS_DIR):
        print(f"Error: Corpus directory not found at {CORPUS_DIR}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create legal_cases table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS legal_cases (
            id TEXT PRIMARY KEY,
            name TEXT,
            austlii_url TEXT,
            catchphrases TEXT,
            summary TEXT
        )
    """)
    conn.commit()

    # Find all case report xml files
    xml_files = glob.glob(os.path.join(CORPUS_DIR, "*.xml"))
    print(f"Found {len(xml_files)} case files to process.")

    count = 0
    batch = []

    for filepath in xml_files:
        try:
            filename = os.path.basename(filepath)
            case_id = os.path.splitext(filename)[0]

            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Robust regex extraction
            name_match = re.search(r'<name>(.*?)</name>', content, re.DOTALL)
            name = name_match.group(1).strip() if name_match else ""

            austlii_match = re.search(r'<AustLII>(.*?)</AustLII>', content, re.DOTALL)
            austlii = austlii_match.group(1).strip() if austlii_match else ""

            # Extract catchphrases
            catchphrases = re.findall(r'<catchphrase.*?>(.*?)</catchphrase>', content, re.DOTALL)
            catchphrases_str = "; ".join([cp.strip() for cp in catchphrases])

            # Extract first 4 sentences for a summary
            sentences = re.findall(r'<sentence[^>]*>(.*?)</sentence>', content, re.DOTALL)
            # Remove any residual internal tags or newlines
            clean_sentences = []
            for s in sentences[:4]:
                clean_s = re.sub(r'<[^>]+>', '', s)  # strip internal tags
                clean_s = re.sub(r'\s+', ' ', clean_s).strip()
                if clean_s:
                    clean_sentences.append(clean_s)
            summary_str = " ".join(clean_sentences)

            batch.append((case_id, name, austlii, catchphrases_str, summary_str))

            if len(batch) >= 200:
                cursor.executemany(
                    "INSERT OR REPLACE INTO legal_cases VALUES (?, ?, ?, ?, ?)",
                    batch
                )
                conn.commit()
                count += len(batch)
                print(f"   Indexed {count} cases...")
                batch = []

        except Exception as e:
            print(f"Error parsing {filepath}: {e}")
            continue

    if batch:
        cursor.executemany(
            "INSERT OR REPLACE INTO legal_cases VALUES (?, ?, ?, ?, ?)",
            batch
        )
        conn.commit()
        count += len(batch)

    print(f"--- Legal Indexing Complete. Total indexed cases: {count} ---")

    print("Creating indexes on legal_cases table...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_case_name ON legal_cases(name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_case_catchphrases ON legal_cases(catchphrases)")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    run_indexing()
