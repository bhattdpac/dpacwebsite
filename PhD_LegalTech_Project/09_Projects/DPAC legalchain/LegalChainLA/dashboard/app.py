"""
app.py
Streamlit dashboard for LegalChain Lit-Analyzer.
Features:
- Upload a PDF file or choose from files in data/pdfs/
- Run entity detection on uploaded/selected PDF
- Display extracted entities in a table
- Allow downloading the extracted result as CSV
- Add basic analytics (count of entities, category breakdowns)
"""

import streamlit as st
import os
import pandas as pd
from src.pdf_reader import extract_text_from_pdf
from src.entity_detector import detect_entities
from src.export_to_csv import export_data_to_csv
from src.analyzer_utils import clean_text

# Set page config
st.set_page_config(
    page_title="LegalChain Lit-Analyzer",
    page_icon="📚",
    layout="wide"
)

# Initialize session state for storing data
if 'entities_df' not in st.session_state:
    st.session_state.entities_df = None
if 'selected_file' not in st.session_state:
    st.session_state.selected_file = None

def process_pdf(pdf_path):
    """Process PDF and extract entities"""
    text = extract_text_from_pdf(pdf_path)
    entities = detect_entities(text)
    return pd.DataFrame(entities)

def pdf_upload_page():
    """PDF Upload and Selection Page"""
    st.header("📂 PDF Upload")
    
    # File uploader
    uploaded_file = st.file_uploader("Upload a PDF file", type="pdf")
    
    # Option to choose from existing files
    pdf_dir = "data/pdfs"
    os.makedirs(pdf_dir, exist_ok=True)
    existing_files = [f for f in os.listdir(pdf_dir) if f.endswith(".pdf")]
    
    if existing_files:
        selected_file = st.selectbox("Or choose an existing PDF", existing_files)
    else:
        selected_file = None
        st.info("No PDF files found in data/pdfs/ directory. Please upload a file.")

    if uploaded_file is not None:
        # Save uploaded file to data/pdfs/
        os.makedirs(pdf_dir, exist_ok=True)
        with open(os.path.join(pdf_dir, uploaded_file.name), "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.success(f"File {uploaded_file.name} uploaded successfully.")
        selected_file = uploaded_file.name

    if selected_file:
        pdf_path = os.path.join(pdf_dir, selected_file)
        st.session_state.selected_file = selected_file
        
        # Process PDF and store results
        with st.spinner("Processing PDF..."):
            st.session_state.entities_df = process_pdf(pdf_path)
        st.success("PDF processed successfully!")

def entity_viewer_page():
    """Entity Viewer Page"""
    st.header("🔍 Entity Viewer")
    
    if st.session_state.entities_df is not None:
        # Add filters
        col1, col2 = st.columns(2)
        with col1:
            category_filter = st.multiselect(
                "Filter by Category",
                options=st.session_state.entities_df["category"].unique()
            )
        with col2:
            search_term = st.text_input("Search in text", "")
        
        # Apply filters
        filtered_df = st.session_state.entities_df
        if category_filter:
            filtered_df = filtered_df[filtered_df["category"].isin(category_filter)]
        if search_term:
            filtered_df = filtered_df[filtered_df["text"].str.contains(search_term, case=False)]
        
        # Display filtered results
        st.dataframe(filtered_df, use_container_width=True)
    else:
        st.info("Please upload or select a PDF file first.")

def analytics_page():
    """Analytics Page"""
    st.header("📈 Analytics")
    
    if st.session_state.entities_df is not None:
        # Basic statistics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Entities", len(st.session_state.entities_df))
        with col2:
            st.metric("Unique Categories", len(st.session_state.entities_df["category"].unique()))
        with col3:
            st.metric("Most Common Category", 
                     st.session_state.entities_df["category"].value_counts().index[0])
        
        # Category distribution
        st.subheader("Category Distribution")
        st.bar_chart(st.session_state.entities_df["category"].value_counts())
        
        # Entity length distribution
        st.subheader("Entity Length Distribution")
        st.session_state.entities_df["length"] = st.session_state.entities_df["text"].str.len()
        st.histogram(st.session_state.entities_df["length"])
    else:
        st.info("Please upload or select a PDF file first.")

def download_page():
    """Download Page"""
    st.header("📥 Download Results")
    
    if st.session_state.entities_df is not None:
        # Export to CSV
        csv_dir = "data/extracted"
        os.makedirs(csv_dir, exist_ok=True)
        csv_path = os.path.join(csv_dir, f"{st.session_state.selected_file.replace('.pdf', '.csv')}")
        export_data_to_csv(st.session_state.entities_df, csv_path)
        
        # Download button
        with open(csv_path, "rb") as f:
            st.download_button(
                "Download CSV",
                f,
                file_name=f"{st.session_state.selected_file.replace('.pdf', '.csv')}",
                mime="text/csv"
            )
    else:
        st.info("Please upload or select a PDF file first.")

# Sidebar navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Go to",
    ["PDF Upload", "Entity Viewer", "Analytics", "Download"]
)

# Display selected page
if page == "PDF Upload":
    pdf_upload_page()
elif page == "Entity Viewer":
    entity_viewer_page()
elif page == "Analytics":
    analytics_page()
elif page == "Download":
    download_page()

# TODO: Add filters/search
# TODO: Show tables and charts  