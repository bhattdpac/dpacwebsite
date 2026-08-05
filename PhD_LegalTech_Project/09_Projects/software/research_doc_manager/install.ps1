# PowerShell installation script for Research Document Manager

Write-Host "Installing Research Document Manager dependencies..." -ForegroundColor Green

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install requirements
Write-Host "Installing requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

# Download NLTK data
Write-Host "Downloading NLTK data..." -ForegroundColor Yellow
python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger')"

# Download spaCy model
Write-Host "Downloading spaCy model..." -ForegroundColor Yellow
python -m spacy download en_core_web_sm

Write-Host "`nInstallation completed!" -ForegroundColor Green
Write-Host "`nTo run the application:" -ForegroundColor Yellow
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd research_doc_manager; uvicorn app.main:app --reload" -ForegroundColor Cyan
Write-Host "`n2. In a new terminal, run the frontend:" -ForegroundColor White
Write-Host "   cd research_doc_manager; python frontend/main_window.py" -ForegroundColor Cyan
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 