#!/usr/bin/env python3
import subprocess
import sys

def test_ollama():
    print("Testing Ollama integration...")
    
    # Test 1: Check if ollama command exists
    try:
        result = subprocess.run(['ollama', '--version'], capture_output=True, text=True)
        print(f"✅ Ollama version: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ Ollama command not found")
        return False
    
    # Test 2: Check available models
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
        print(f"✅ Available models:\n{result.stdout}")
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return False
    
    # Test 3: Test academic-assistant model
    try:
        result = subprocess.run([
            'ollama', 'run', 'academic-assistant', 
            '--prompt', 'Summarize this: Machine learning is a subset of artificial intelligence.'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(f"✅ Academic assistant test successful!")
            print(f"Response: {result.stdout.strip()[:100]}...")
            return True
        else:
            print(f"❌ Academic assistant test failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Academic assistant test timed out")
        return False
    except Exception as e:
        print(f"❌ Academic assistant test error: {e}")
        return False

if __name__ == "__main__":
    success = test_ollama()
    sys.exit(0 if success else 1) 