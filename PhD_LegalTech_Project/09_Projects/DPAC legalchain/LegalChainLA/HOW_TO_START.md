# How to Start LegalChain Lit-Analyzer

This guide will help you get started with the LegalChain Lit-Analyzer application.

## Prerequisites

Before you begin, make sure you have:
- Python 3.8 or higher installed
- A code editor (VS Code, PyCharm, etc.)
- Basic knowledge of command line/terminal

## Step 1: Clone and Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone [repository-url]
   cd LegalChain-LitAnalyzer
   ```

2. **Create a virtual environment**:
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Step 2: Prepare Your Environment

1. **Create required directories**:
   ```bash
   # The app will create these automatically, but you can create them manually:
   mkdir -p data/pdfs
   mkdir -p data/extracted
   ```

2. **Add sample PDFs**:
   - Place your PDF files in the `data/pdfs/` directory
   - You can copy files using:
     ```bash
     # On Windows
     copy path\to\your\pdfs\*.pdf data\pdfs\

     # On macOS/Linux
     cp path/to/your/pdfs/*.pdf data/pdfs/
     ```

## Step 3: Run the Application

1. **Start the Streamlit app**:
   ```bash
   python -m streamlit run dashboard/app.py
   ```

2. **Access the application**:
   - The app will automatically open in your default browser
   - If it doesn't, manually open: http://localhost:8501

## Step 4: Using the Application

### A. PDF Upload Page
1. Click "PDF Upload" in the sidebar
2. Choose your method:
   - **Upload new PDF**: Click "Browse files" or drag & drop
   - **Select existing PDF**: Use the dropdown menu
3. Wait for processing to complete

### B. Entity Viewer Page
1. Click "Entity Viewer" in the sidebar
2. Use the features:
   - Filter by category using the dropdown
   - Search within entities using the search box
   - Sort by clicking column headers
   - Resize columns by dragging

### C. Analytics Page
1. Click "Analytics" in the sidebar
2. View:
   - Key metrics at the top
   - Category distribution chart
   - Entity length histogram

### D. Download Page
1. Click "Download" in the sidebar
2. Click "Download CSV" to save results

## Common Issues and Solutions

### 1. Application Won't Start
- Check if Python is installed: `python --version`
- Verify virtual environment is activated
- Ensure all dependencies are installed
- Check if port 8501 is available

### 2. No PDFs Found
- Verify PDFs are in `data/pdfs/` directory
- Check file permissions
- Ensure PDFs are valid and not corrupted

### 3. Processing Errors
- Check terminal for error messages
- Verify PDF is not password protected
- Ensure PDF is readable and not corrupted

### 4. Slow Performance
- Check PDF size (large files take longer)
- Monitor system resources
- Close other resource-intensive applications

## Best Practices

1. **File Management**:
   - Keep PDFs organized in `data/pdfs/`
   - Regularly clean up `data/extracted/`
   - Use meaningful file names

2. **Performance**:
   - Process one PDF at a time
   - Keep PDFs under 50MB for best performance
   - Close other applications while processing

3. **Data Security**:
   - Don't upload sensitive documents
   - Regularly backup extracted data
   - Keep your virtual environment secure

## Getting Help

If you encounter issues:
1. Check the terminal for error messages
2. Review the README.md file
3. Check the project documentation
4. Submit an issue on the project repository

## Next Steps

After getting familiar with the basics:
1. Try different types of PDFs
2. Experiment with the analytics features
3. Explore the filtering capabilities
4. Test the export functionality

Remember: The application will continue running until you stop it (Ctrl+C in terminal). You can keep it running and interact with it through your web browser. 