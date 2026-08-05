@echo off
echo Building Research Document Manager...

REM Create and activate virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Create icon
echo Creating application icon...
python build_icon.py

REM Build executable
echo Building executable...
python build.py

echo Build completed!
pause 