import os
import uuid
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, flash
import pyttsx3
from gtts import gTTS
from werkzeug.utils import secure_filename
import requests
from pdfminer.high_level import extract_text
import sqlite3
from contextlib import contextmanager

UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'audio'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

DATABASE_FILE = 'podcast_library.db'

@contextmanager
def get_db():
    """Database context manager for SQLite."""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    with sqlite3.connect(DATABASE_FILE) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                original_name TEXT NOT NULL,
                upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                file_size INTEGER,
                text_length INTEGER,
                estimated_duration TEXT,
                processing_status TEXT DEFAULT 'processing',
                audio_ready BOOLEAN DEFAULT FALSE,
                play_count INTEGER DEFAULT 0,
                last_played TIMESTAMP,
                bookmarks TEXT DEFAULT '[]',
                tags TEXT DEFAULT '',
                voice_settings TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.secret_key = 'supersecretkey'  # Change this in production

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using pdfminer.six."""
    try:
        return extract_text(pdf_path)
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def generate_audio(text, audio_path, method='gtts'):
    if method == 'pyttsx3':
        engine = pyttsx3.init()
        engine.save_to_file(text, audio_path)
        engine.runAndWait()
    else:
        tts = gTTS(text)
        tts.save(audio_path)

def query_ollama(prompt, model="llama3.2:latest"):
    """Query the local Ollama LLM for summarization or other tasks."""
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()["response"]
    except Exception as e:
        # Log or handle Ollama API errors
        return f"[Ollama API error: {e}]"

@app.route('/')
def index():
    """Dashboard with recent conversions."""
    with get_db() as conn:
        files = conn.execute('SELECT * FROM files ORDER BY upload_time DESC LIMIT 12').fetchall()
    return render_template('dashboard.html', files=files)

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'pdf' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['pdf']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_id = str(uuid.uuid4())
            base, ext = os.path.splitext(filename)
            unique_filename = f"{base}_{unique_id}{ext}"
            pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(pdf_path)
            # Extract text
            text = extract_text_from_pdf(pdf_path)
            # Generate audio
            audio_filename = f"{base}_{unique_id}.mp3"
            audio_path = os.path.join(app.config['AUDIO_FOLDER'], audio_filename)
            try:
                generate_audio(text, audio_path, method='gtts')
            except Exception as e:
                flash(f'Audio generation failed: {e}')
                return redirect(request.url)
            flash('File uploaded and audio generated!')
            return redirect(url_for('index'))
        else:
            flash('Invalid file type. Only PDFs allowed.')
            return redirect(request.url)
    return render_template('upload.html')

@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(app.config['AUDIO_FOLDER'], filename)

@app.route('/uploads/<filename>')
def serve_pdf(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/player/<file_id>')
def player(file_id):
    with get_db() as conn:
        file_info = conn.execute('SELECT * FROM files WHERE id = ?', (file_id,)).fetchone()
    if not file_info:
        flash('File not found', 'error')
        return redirect(url_for('index'))
    return render_template('player.html', file=file_info)

@app.route('/summarize/<file_id>')
def summarize(file_id):
    """Summarize the extracted text of a PDF using Ollama and display it."""
    with get_db() as conn:
        file_info = conn.execute('SELECT * FROM files WHERE id = ?', (file_id,)).fetchone()
    if not file_info:
        flash('File not found', 'error')
        return redirect(url_for('index'))
    # Load the extracted text
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{file_info['original_name']}")
    try:
        text = extract_text_from_pdf(pdf_path)
    except Exception as e:
        flash(f'Error extracting text: {e}', 'error')
        return redirect(url_for('index'))
    # Limit prompt size for context window
    prompt = f"Summarize this research paper:\n{text[:2000]}"
    summary = query_ollama(prompt)
    return render_template('summary.html', summary=summary, file=file_info)

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(AUDIO_FOLDER, exist_ok=True)
    init_database()
    app.run(debug=True) 