@echo off
echo Installing Research Document Manager dependencies...

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Download NLTK data
echo Downloading NLTK data...
python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger')"

REM Download spaCy model
echo Downloading spaCy model...
python -m spacy download en_core_web_sm

echo Installation completed!
echo.
echo To run the application:
echo 1. Start the backend server: uvicorn app.main:app --reload
echo 2. Run the frontend: python frontend/main_window.py
echo.
pause 