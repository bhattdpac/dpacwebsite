import os
import uuid
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify, flash
from werkzeug.utils import secure_filename
from ollama_summary import summarize, extract_metadata
from chat_engine import chat_with_paper
import fitz
from gtts import gTTS
import json

UPLOAD_FOLDER = 'uploads'
SUMMARY_FOLDER = 'summaries'
AUDIO_FOLDER = 'static/audio'
METADATA_FOLDER = 'metadata'
ALLOWED_EXTENSIONS = {'pdf'}

app = Flask(__name__)
app.secret_key = 'supersecretkey'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SUMMARY_FOLDER'] = SUMMARY_FOLDER
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER
app.config['METADATA_FOLDER'] = METADATA_FOLDER

# Ensure folders exist
for folder in [UPLOAD_FOLDER, SUMMARY_FOLDER, AUDIO_FOLDER, METADATA_FOLDER]:
    os.makedirs(folder, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text(pdf_path):
    """Extract text from PDF using PyMuPDF"""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        raise Exception(f"PDF text extraction failed: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        flash('No file selected')
        return redirect(url_for('index'))
    
    file = request.files['file']
    if file.filename == '':
        flash('No file selected')
        return redirect(url_for('index'))
    
    if not allowed_file(file.filename):
        flash('Invalid file type. Only PDF files are allowed.')
        return redirect(url_for('index'))
    
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.pdf"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save uploaded file
        file.save(file_path)
        
        # Extract text from PDF
        text = extract_text(file_path)
        if not text:
            flash('Could not extract text from PDF. The file might be empty or corrupted.')
            return redirect(url_for('index'))
        
        # Save extracted text
        text_path = os.path.join(app.config['SUMMARY_FOLDER'], f"{file_id}.txt")
        with open(text_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        # Generate AI summary
        summary = summarize(text)
        summary_path = os.path.join(app.config['SUMMARY_FOLDER'], f"{file_id}.summary.txt")
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary)
        
        # Extract structured metadata
        metadata = extract_metadata(text)
        metadata_path = os.path.join(app.config['METADATA_FOLDER'], f"{file_id}.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        # Generate audio if requested
        audio_filename = None
        if 'tts' in request.form:
            try:
                tts = gTTS(summary)
                audio_filename = f"{file_id}.mp3"
                audio_path = os.path.join(app.config['AUDIO_FOLDER'], audio_filename)
                tts.save(audio_path)
                flash('Audio podcast generated successfully!')
            except Exception as e:
                flash(f'Audio generation failed: {e}')
        
        flash('PDF processed successfully! Summary and metadata generated.')
        return redirect(url_for('dashboard'))
        
    except Exception as e:
        flash(f'Error processing file: {e}')
        return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    files = []
    try:
        for fname in os.listdir(UPLOAD_FOLDER):
            if fname.endswith('.pdf'):
                file_id = fname.rsplit('.', 1)[0]
                summary = ''
                audio = None
                metadata = None
                
                # Get summary
                summary_path = os.path.join(app.config['SUMMARY_FOLDER'], f"{file_id}.summary.txt")
                if os.path.exists(summary_path):
                    with open(summary_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        summary = content[:300] + '...' if len(content) > 300 else content
                
                # Check for audio
                audio_path = os.path.join(app.config['AUDIO_FOLDER'], f"{file_id}.mp3")
                if os.path.exists(audio_path):
                    audio = f"{file_id}.mp3"
                
                # Check for metadata
                metadata_path = os.path.join(app.config['METADATA_FOLDER'], f"{file_id}.json")
                if os.path.exists(metadata_path):
                    metadata = f"{file_id}.json"
                
                files.append({
                    'id': file_id,
                    'filename': fname,
                    'summary': summary,
                    'audio': audio,
                    'metadata': metadata
                })
    except Exception as e:
        flash(f'Error loading dashboard: {e}')
    
    return render_template('dashboard.html', files=files)

@app.route('/summary/<file_id>')
def view_summary(file_id):
    summary_path = os.path.join(app.config['SUMMARY_FOLDER'], f"{file_id}.summary.txt")
    if not os.path.exists(summary_path):
        flash('Summary not found.')
        return redirect(url_for('dashboard'))
    
    with open(summary_path, 'r', encoding='utf-8') as f:
        summary = f.read()
    
    audio = f"{file_id}.mp3" if os.path.exists(os.path.join(app.config['AUDIO_FOLDER'], f"{file_id}.mp3")) else None
    return render_template('play.html', summary=summary, audio=audio)

@app.route('/metadata/<file_id>')
def view_metadata(file_id):
    metadata_path = os.path.join(app.config['METADATA_FOLDER'], f"{file_id}.json")
    if not os.path.exists(metadata_path):
        flash('Metadata not found.')
        return redirect(url_for('dashboard'))
    
    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    
    return render_template('metadata.html', metadata=metadata)

@app.route('/chat/<file_id>', methods=['GET', 'POST'])
def chat(file_id):
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.pdf")
    if not os.path.exists(pdf_path):
        flash('PDF not found.')
        return redirect(url_for('dashboard'))
    
    text = extract_text(pdf_path)
    answer = None
    question = ''
    
    if request.method == 'POST':
        question = request.form.get('question', '')
        if question.strip():
            answer = chat_with_paper(text, question)
    
    return render_template('chat.html', file_id=file_id, question=question, answer=answer)

@app.route('/audio/<filename>')
def audio_file(filename):
    return send_from_directory(app.config['AUDIO_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True) 