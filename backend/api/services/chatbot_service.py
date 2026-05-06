import requests
import json
import os
import subprocess
from django.conf import settings

OLLAMA_API_URL = "http://localhost:11434/api/generate"

class OllamaChatService:
    @staticmethod
    def ask_model(model_name, prompt):
        """
        Sends a prompt to the local Ollama instance.
        """
        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False
        }
        
        try:
            response = requests.post(OLLAMA_API_URL, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "No response from model.")
        except Exception as e:
            return f"Ollama Error: {str(e)}"

class GithubBackupService:
    @staticmethod
    def save_chat_to_github(chat_history, filename):
        """
        Saves chat logs to the local git repo and pushes if configured.
        For a portfolio, we might just save to a 'logs/' folder that the user can commit.
        """
        log_dir = os.path.join(settings.BASE_DIR, 'chat_logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        file_path = os.path.join(log_dir, filename)
        
        with open(file_path, 'w') as f:
            json.dump(chat_history, f, indent=4)
            
        return f"Chat saved to {file_path}. Use 'git add' and 'git commit' to push to GitHub."

    @staticmethod
    def auto_commit_log(filename):
        """
        Optional: Automatically stages and commits the log file.
        Requires Git to be configured on the server.
        """
        try:
            # Note: This is simplified. In production, use GitHub API for cleaner integration.
            subprocess.run(["git", "add", f"backend/chat_logs/{filename}"], check=True)
            subprocess.run(["git", "commit", "-m", f"Auto-save chat log: {filename}"], check=True)
            return "Committed to local Git."
        except Exception as e:
            return f"Git Error: {str(e)}"
