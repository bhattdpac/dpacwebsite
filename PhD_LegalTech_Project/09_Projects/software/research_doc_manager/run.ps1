# PowerShell script to run Research Document Manager

# Function to check if a process is running
function Test-ProcessRunning {
    param($ProcessName)
    return (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) -ne $null
}

# Set the working directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath'; uvicorn app.main:app --reload" -PassThru

# Wait for backend to start
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting frontend application..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptPath'; python frontend/main_window.py" -PassThru

Write-Host "`nApplication started!" -ForegroundColor Green
Write-Host "Backend server is running at http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend application should open in a new window" -ForegroundColor Cyan
Write-Host "`nPress any key to exit this script (this will not close the application)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 