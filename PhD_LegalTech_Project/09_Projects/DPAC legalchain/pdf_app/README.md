# PDF to Podcast App

A Flask web application to upload PDF files, extract their text, and convert them into natural-sounding audio podcasts.

## Features
- Upload PDF files (research papers, articles, etc.)
- Extract text using PyMuPDF
- Convert text to audio (MP3) using gTTS (Google Text-to-Speech)
- Download and play audio via a web interface
- Clean UI with Bootstrap
- Safe file handling and unique filenames

## Folder Structure
```
pdf_app/
├── app.py
├── requirements.txt
├── README.md
├── uploads/        # Uploaded PDF files
├── audio/          # Generated audio files
├── templates/      # HTML templates
│   ├── base.html
│   ├── index.html
│   └── upload.html
├── static/         # Static files (CSS, JS, etc.)
└── venv/           # Python virtual environment
```

## Setup Instructions

1. **Clone or download this repository.**

2. **Create and activate a virtual environment:**
   ```sh
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

4. **Run the app:**
   ```sh
   python app.py
   ```
   The app will be available at [http://127.0.0.1:5000](http://127.0.0.1:5000)

5. **Usage:**
   - Go to `/upload` to upload a PDF.
   - After upload, return to the home page to see your file and play the generated audio.

## Notes
- Maximum PDF size: 16MB
- Only PDF files are allowed
- Audio is generated using gTTS (requires internet connection)
- For offline TTS, modify `generate_audio` in `app.py` to use `pyttsx3`

## Optional Enhancements
- Playback speed control
- Summarization of long papers
- User upload history (with SQLite or MongoDB)

---
MIT License 

requests>=2.28 

import requests

def query_ollama(prompt, model="llama2"):
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False  # Set to True for streaming responses
    }
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()["response"] 