import json
import sqlite3
import os
import sys

SNAPSHOT_PATH = "/root/.cache/kagglehub/datasets/Cornell-University/arxiv/versions/297/arxiv-metadata-oai-snapshot.json"
DB_PATH = "/root/dpacwebsite/backend/arxiv_index.db"

def run_indexing():
    if os.path.exists(DB_PATH):
        print(f"Index database already exists at {DB_PATH}. Skipping indexing.")
        return

    if not os.path.exists(SNAPSHOT_PATH):
        print(f"Error: arXiv snapshot JSON not found at {SNAPSHOT_PATH}", file=sys.stderr)
        sys.exit(1)

    print("--- Starting arXiv Legal/Blockchain Indexing ---")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS arxiv_papers (
            id TEXT PRIMARY KEY,
            title TEXT,
            authors TEXT,
            categories TEXT,
            abstract TEXT
        )
    """)
    conn.commit()

    print("Scanning arXiv snapshot... Filtering relevant legal/blockchain/cryptography papers...")
    
    count = 0
    batch = []
    
    # We target security/cryptography (cs.CR), computers and society (cs.CY), and blockchain keywords
    keywords = ["blockchain", "smart contract", "distributed ledger", "cryptocurrency", "ethereum", "legal tech", "smart legal"]

    with open(SNAPSHOT_PATH, 'r') as f:
        for line in f:
            try:
                entry = json.loads(line)
                title = entry.get("title", "")
                abstract = entry.get("abstract", "")
                categories = entry.get("categories", "")
                
                # Check category matches or keyword matches
                is_relevant = False
                if "cs.CR" in categories or "cs.CY" in categories:
                    is_relevant = True
                else:
                    title_lower = title.lower()
                    abs_lower = abstract.lower()
                    if any(kw in title_lower or kw in abs_lower for kw in keywords):
                        is_relevant = True
                
                if is_relevant:
                    batch.append((
                        entry.get("id"),
                        title.strip().replace("\n", " "),
                        entry.get("authors", "").strip().replace("\n", " "),
                        categories.strip(),
                        abstract.strip().replace("\n", " ")
                    ))
                    
                    if len(batch) >= 1000:
                        cursor.executemany(
                            "INSERT OR IGNORE INTO arxiv_papers VALUES (?, ?, ?, ?, ?)", 
                            batch
                        )
                        conn.commit()
                        count += len(batch)
                        print(f"   Indexed {count} papers...")
                        batch = []
                        
            except Exception as e:
                continue

    # Insert remaining batch
    if batch:
        cursor.executemany("INSERT OR IGNORE INTO arxiv_papers VALUES (?, ?, ?, ?, ?)", batch)
        conn.commit()
        count += len(batch)

    print(f"--- Indexing Complete. Total indexed papers: {count} ---")
    
    # Create index for fast searches
    print("Creating indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_title ON arxiv_papers(title)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_categories ON arxiv_papers(categories)")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    run_indexing()
