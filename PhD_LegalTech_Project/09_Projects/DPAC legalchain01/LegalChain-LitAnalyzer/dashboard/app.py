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

st.title("LegalChain Lit-Analyzer Dashboard")

# File uploader
uploaded_file = st.file_uploader("Upload a PDF file", type="pdf")

# Option to choose from existing files
pdf_dir = "../data/pdfs"
existing_files = [f for f in os.listdir(pdf_dir) if f.endswith(".pdf")]
selected_file = st.selectbox("Or choose an existing PDF", existing_files)

if uploaded_file is not None:
    # Save uploaded file to data/pdfs/
    with open(os.path.join(pdf_dir, uploaded_file.name), "wb") as f:
        f.write(uploaded_file.getbuffer())
    st.success(f"File {uploaded_file.name} uploaded successfully.")
    selected_file = uploaded_file.name

if selected_file:
    pdf_path = os.path.join(pdf_dir, selected_file)
    text = extract_text_from_pdf(pdf_path)
    entities = detect_entities(text)

    # Display extracted entities in a table
    st.subheader("Extracted Entities")
    df = pd.DataFrame(entities)
    st.dataframe(df)

    # Basic analytics
    st.subheader("Analytics")
    st.write(f"Total entities: {len(df)}")
    st.write("Category breakdown:")
    st.bar_chart(df["category"].value_counts())

    # Download as CSV
    csv_path = os.path.join("../data/extracted", f"{selected_file.replace('.pdf', '.csv')}")
    export_data_to_csv(df, csv_path)
    with open(csv_path, "rb") as f:
        st.download_button("Download CSV", f, file_name=f"{selected_file.replace('.pdf', '.csv')}")

# TODO: Add filters/search
# TODO: Show tables and charts  