import os
import uuid
import json
import threading
import requests
import sqlite3
from contextlib import contextmanager
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from werkzeug.utils import secure_filename
from pdfminer.high_level import extract_text
import pyttsx3
from gtts import gTTS

# --- Config ---
UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'audio'
DB_FILE = 'podcast_library.db'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024

app = Flask(__name__)
app.secret_key = 'supersecretkey'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Database ---
def init_db():
    with sqlite3.connect(DB_FILE) as conn:
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
                summary TEXT DEFAULT '',
                voice_settings TEXT DEFAULT '{}'
            )
        ''')
        conn.commit()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

init_db()

# --- Helpers ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def estimate_duration(text_length, wpm=150):
    words = text_length // 5
    minutes = words / wpm
    if minutes < 1:
        return f"{int(minutes * 60)} seconds"
    elif minutes < 60:
        return f"{minutes:.1f} minutes"
    else:
        hours = minutes / 60
        return f"{hours:.1f} hours"

def extract_text_from_pdf(pdf_path):
    try:
        return extract_text(pdf_path)
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def generate_audio(text, audio_path, voice_settings=None, method='pyttsx3'):
    if method == 'pyttsx3':
        engine = pyttsx3.init()
        if voice_settings:
            engine.setProperty('rate', voice_settings.get('rate', 180))
            engine.setProperty('volume', voice_settings.get('volume', 0.9))
            if voice_settings.get('voice_id'):
                for voice in engine.getProperty('voices'):
                    if voice.id == voice_settings['voice_id']:
                        engine.setProperty('voice', voice.id)
                        break
        engine.save_to_file(text, audio_path)
        engine.runAndWait()
    else:
        tts = gTTS(text)
        tts.save(audio_path)

def query_ollama(prompt, model="llama3.2:latest"):
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
        return f"[Ollama API error: {e}]"

# --- Routes ---
@app.route('/')
def index():
    with get_db() as conn:
        files = conn.execute('SELECT * FROM files ORDER BY upload_time DESC LIMIT 12').fetchall()
    return render_template('dashboard.html', files=files)

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected', 'error')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            file_id = str(uuid.uuid4())
            filename = secure_filename(file.filename)
            original_name = filename
            filename = f"{file_id}_{filename}"
            pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(pdf_path)
            file_size = os.path.getsize(pdf_path)
            # Voice settings
            voice_settings = {
                'rate': int(request.form.get('rate', 180)),
                'volume': float(request.form.get('volume', 0.9)),
                'voice_id': request.form.get('voice_id', '')
            }
            # Extract text
            try:
                text = extract_text_from_pdf(pdf_path)
            except Exception as e:
                flash(f'Error extracting text: {e}', 'error')
                os.remove(pdf_path)
                return redirect(request.url)
            if not text:
                flash('Could not extract text from PDF.', 'error')
                os.remove(pdf_path)
                return redirect(request.url)
            text_length = len(text)
            estimated_duration = estimate_duration(text_length)
            audio_filename = f"{file_id}.wav"
            audio_path = os.path.join(app.config['AUDIO_FOLDER'], audio_filename)
            # Save to DB
            with get_db() as conn:
                conn.execute('''
                    INSERT INTO files (id, original_name, file_size, text_length, estimated_duration, voice_settings)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (file_id, original_name, file_size, text_length, estimated_duration, json.dumps(voice_settings)))
                conn.commit()
            # Generate audio in background
            threading.Thread(target=generate_audio, args=(text, audio_path, voice_settings)).start()
            flash(f'File "{original_name}" uploaded! Audio generation started.', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid file type. Please upload a PDF.', 'error')
            return redirect(request.url)
    # Get voices for form
    try:
        engine = pyttsx3.init()
        voices = engine.getProperty('voices') or []
        available_voices = [{'id': v.id, 'name': v.name} for v in voices]
    except:
        available_voices = []
    return render_template('upload.html', voices=available_voices)

@app.route('/player/<file_id>')
def player(file_id):
    with get_db() as conn:
        file_info = conn.execute('SELECT * FROM files WHERE id = ?', (file_id,)).fetchone()
    if not file_info:
        flash('File not found', 'error')
        return redirect(url_for('index'))
    return render_template('player.html', file=file_info)

@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(app.config['AUDIO_FOLDER'], filename)

@app.route('/summarize/<file_id>')
def summarize(file_id):
    with get_db() as conn:
        file_info = conn.execute('SELECT * FROM files WHERE id = ?', (file_id,)).fetchone()
    if not file_info:
        flash('File not found', 'error')
        return redirect(url_for('index'))
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{file_info['original_name']}")
    try:
        text = extract_text_from_pdf(pdf_path)
    except Exception as e:
        flash(f'Error extracting text: {e}', 'error')
        return redirect(url_for('index'))
    prompt = f"Summarize this research paper:\n{text[:2000]}"
    summary = query_ollama(prompt)
    # Save summary to DB
    with get_db() as conn:
        conn.execute('UPDATE files SET summary = ? WHERE id = ?', (summary, file_id))
        conn.commit()
    return render_template('summary.html', summary=summary, file=file_info)

if __name__ == '__main__':
    app.run(debug=True) 