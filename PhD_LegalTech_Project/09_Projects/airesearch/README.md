# AI Research Assistant

A full-stack web application for academic paper analysis, summarization, and audio podcast generation using Flask, Tailwind CSS, PyMuPDF, gTTS, and local LLMs (Ollama).

## Features
- Upload academic PDFs (drag & drop or file picker)
- Extract full text from PDFs
- Generate AI summary using local LLM (Ollama, llama3)
- Extract structured metadata (objectives, findings, contributions, limitations)
- Convert summary to audio (MP3) with gTTS
- Store uploads, summaries, audio, and metadata in organized folders
- Dashboard to view all uploads, play audio, view summary/metadata, and chat with the paper
- Chat interface to ask questions about the paper using LLM

## Folder Structure
- `app.py` - Flask backend
- `ollama_summary.py` - LLM summary logic
- `chat_engine.py` - LLM Q&A logic
- `templates/` - Jinja2 HTML templates
- `static/audio/` - MP3 files
- `uploads/` - PDF uploads
- `summaries/` - Extracted text and summaries
- `metadata/` - JSON metadata

## Setup
1. **Install Python 3.8+**
2. **Install Ollama and download llama3 model**
   - [Ollama install guide](https://ollama.com/download)
   - `ollama pull llama3`
3. **Clone this repo and install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Run the app:**
   ```bash
   python app.py
   ```
5. **Visit** [http://localhost:5000](http://localhost:5000)

## Notes
- All files are stored locally in their respective folders.
- Only PDF files are accepted.
- Audio is generated using gTTS (requires internet).
- LLM summary and chat require Ollama running locally.

## License
MIT 