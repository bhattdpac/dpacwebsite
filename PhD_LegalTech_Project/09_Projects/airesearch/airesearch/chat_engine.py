import subprocess

def chat_with_paper(text, question):
    prompt = f"Given the following paper:\n{text}\n\nAnswer the question: {question}"
    result = subprocess.run([
        'ollama', 'run', 'llama3', '--prompt', prompt
    ], capture_output=True, text=True)
    return result.stdout.strip() 