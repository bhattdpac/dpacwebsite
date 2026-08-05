import PyInstaller.__main__
import os
import shutil

def build_exe():
    # Clean previous builds
    if os.path.exists('dist'):
        shutil.rmtree('dist')
    if os.path.exists('build'):
        shutil.rmtree('build')
        
    # PyInstaller arguments
    args = [
        'frontend/main_window.py',  # Main script
        '--name=ResearchDocManager',  # Name of the executable
        '--onefile',  # Create a single executable file
        '--windowed',  # Don't show console window
        '--icon=assets/icon.ico',  # Application icon
        '--add-data=assets;assets',  # Include assets folder
        '--hidden-import=PyQt6',
        '--hidden-import=requests',
        '--hidden-import=pandas',
        '--clean',  # Clean PyInstaller cache
        '--noconfirm',  # Replace existing build without asking
    ]
    
    # Run PyInstaller
    PyInstaller.__main__.run(args)
    
    print("Build completed successfully!")

if __name__ == '__main__':
    build_exe() 