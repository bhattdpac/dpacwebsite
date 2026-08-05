import os
from flask import Flask, request, render_template, redirect, url_for, send_from_directory, flash
import uuid
import fitz  # PyMuPDF
from gtts import gTTS
import json
from ollama_summary import summarize
from chat_engine import chat_with_paper

app = Flask(__name__)

# Folder paths
UPLOAD_FOLDER = 'uploads'
SUMMARY_FOLDER = 'summaries'
AUDIO_FOLDER = 'static/audio'
METADATA_FOLDER = 'metadata'

# Ensure folders exist
for folder in [UPLOAD_FOLDER, SUMMARY_FOLDER, AUDIO_FOLDER, METADATA_FOLDER]:
    os.makedirs(folder, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {'pdf'}

# Helper functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def extract_metadata(text):
    # Use LLM to extract structured metadata
    prompt = (
        "Extract the following from the academic paper as JSON with keys: objectives, findings, contributions, limitations. "
        "If not found, use an empty string.\n\nPaper:\n" + text
    )
    result = summarize(prompt)
    try:
        metadata = json.loads(result)
    except Exception:
        metadata = {
            "objectives": "",
            "findings": "",
            "contributions": "",
            "limitations": ""
        }
    return metadata

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        flash('No selected file')
        return redirect(request.url)
    if file and allowed_file(file.filename):
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.pdf"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        # Extract text
        text = extract_text(file_path)
        if not text.strip():
            flash('PDF is empty or could not extract text.')
            return redirect(url_for('index'))
        # Generate summary
        summary = summarize(text)
        summary_path = os.path.join(SUMMARY_FOLDER, f"{file_id}.txt")
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary)
        # Extract metadata
        metadata = extract_metadata(text)
        metadata_path = os.path.join(METADATA_FOLDER, f"{file_id}.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        # Generate audio if requested
        audio_filename = None
        if 'tts' in request.form:
            try:
                tts = gTTS(text)
                audio_filename = f"{file_id}.mp3"
                audio_path = os.path.join(AUDIO_FOLDER, audio_filename)
                tts.save(audio_path)
            except Exception as e:
                flash(f'Audio generation failed: {e}')
        return redirect(url_for('dashboard'))
    else:
        flash('Invalid file type. Only PDF allowed.')
        return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    files = []
    for fname in os.listdir(UPLOAD_FOLDER):
        if fname.endswith('.pdf'):
            file_id = fname.rsplit('.', 1)[0]
            summary = ''
            audio = None
            summary_path = os.path.join(SUMMARY_FOLDER, f"{file_id}.txt")
            audio_path = os.path.join(AUDIO_FOLDER, f"{file_id}.mp3")
            if os.path.exists(summary_path):
                with open(summary_path, 'r', encoding='utf-8') as f:
                    summary = f.read()[:300] + '...'
            if os.path.exists(audio_path):
                audio = f"{file_id}.mp3"
            files.append({
                'id': file_id,
                'filename': fname,
                'summary': summary,
                'audio': audio
            })
    return render_template('dashboard.html', files=files)

@app.route('/summary/<file_id>')
def view_summary(file_id):
    summary_path = os.path.join(SUMMARY_FOLDER, f"{file_id}.txt")
    if not os.path.exists(summary_path):
        flash('Summary not found.')
        return redirect(url_for('dashboard'))
    with open(summary_path, 'r', encoding='utf-8') as f:
        summary = f.read()
    audio = f"{file_id}.mp3" if os.path.exists(os.path.join(AUDIO_FOLDER, f"{file_id}.mp3")) else None
    return render_template('play.html', summary=summary, audio=audio)

@app.route('/metadata/<file_id>')
def view_metadata(file_id):
    metadata_path = os.path.join(METADATA_FOLDER, f"{file_id}.json")
    if not os.path.exists(metadata_path):
        flash('Metadata not found.')
        return redirect(url_for('dashboard'))
    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    return render_template('metadata.html', metadata=metadata)

@app.route('/chat/<file_id>', methods=['GET', 'POST'])
def chat(file_id):
    pdf_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.pdf")
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

if __name__ == '__main__':
    app.run(debug=True) 