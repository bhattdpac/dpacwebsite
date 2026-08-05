import ollama

def chat_with_paper(text, question):
    """Answer questions about the academic paper using context"""
    CHAT_PROMPT = f"""
You are an academic research assistant. Answer the following question about this research paper.

Paper Content:
{text[:4000]}

Question: {question}

Please provide a clear, evidence-based answer using information from the paper. If the answer is not found in the paper, say so clearly.
"""
    try:
        response = ollama.chat(model='researcher', messages=[
            {
                'role': 'user',
                'content': CHAT_PROMPT
            }
        ])
        return response['message']['content']
    except Exception as e:
        return f"[Chat failed: {e}]" 