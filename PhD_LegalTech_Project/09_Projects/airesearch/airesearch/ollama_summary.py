import subprocess

def summarize(text):
    prompt = f"Summarize the following academic paper:\n{text}"
    result = subprocess.run([
        'ollama', 'run', 'llama3', '--prompt', prompt
    ], capture_output=True, text=True)
    return result.stdout.strip() 