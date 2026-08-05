# AI Research Assistant

## Features
- Upload academic PDFs
- Extract text, generate audio, AI summary, and metadata
- Chat with the paper using local LLM (Ollama)

## Setup
1. Install Python 3.8+
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Install and run Ollama (https://ollama.com/)
   ```
   ollama pull llama3
   ollama serve
   ```
4. Run the app:
   ```
   python app.py
   ```
5. Visit http://127.0.0.1:5000/

## Folder Structure
- uploads/: PDF files
- summaries/: AI summaries
- static/audio/: MP3 files
- metadata/: JSON metadata 