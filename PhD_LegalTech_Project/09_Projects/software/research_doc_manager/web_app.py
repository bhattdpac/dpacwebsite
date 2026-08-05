import streamlit as st
import requests
import json
import os
from typing import Optional
import pandas as pd

API_BASE_URL = "http://localhost:8000/api/v1"

st.set_page_config(
    page_title="Research Document Manager",
    page_icon="📚",
    layout="wide"
)

st.title("Research Document Manager 📚")

# Sidebar
st.sidebar.title("Menu")
page = st.sidebar.radio(
    "Select Page",
    ["Upload Document", "Search Documents", "Document List"]
)

if page == "Upload Document":
    st.header("Upload Document")
    
    uploaded_file = st.file_uploader("Choose PDF or Image file", type=['pdf', 'png', 'jpg', 'jpeg'])
    
    if uploaded_file is not None:
        if st.button("Upload"):
            try:
                files = {'file': uploaded_file}
                response = requests.post(f"{API_BASE_URL}/upload/", files=files)
                response.raise_for_status()
                result = response.json()
                st.success(f"Document uploaded successfully (ID: {result['id']})")
            except Exception as e:
                st.error(f"Error: {str(e)}")

elif page == "Search Documents":
    st.header("Search Documents")
    
    query = st.text_input("Enter search term")
    col1, col2 = st.columns(2)
    
    with col1:
        category = st.text_input("Category (Optional)")
    with col2:
        language = st.text_input("Language (Optional)")
    
    if st.button("Search"):
        if query:
            try:
                params = {'query': query}
                if category:
                    params['category'] = category
                if language:
                    params['language'] = language
                    
                response = requests.get(f"{API_BASE_URL}/search/", params=params)
                response.raise_for_status()
                results = response.json()['results']
                
                if not results:
                    st.info("No results found")
                else:
                    for doc in results:
                        with st.expander(f"📄 {doc['title']}"):
                            st.write(f"**ID:** {doc['id']}")
                            st.write(f"**File Type:** {doc['file_type']}")
                            st.write(f"**Language:** {doc['language']}")
                            st.write(f"**Category:** {doc['category'] or 'Not specified'}")
                            st.write(f"**Abstract:**")
                            st.write(doc['abstract'])
                            
                            if st.button("View Details", key=f"details_{doc['id']}"):
                                try:
                                    response = requests.get(f"{API_BASE_URL}/documents/{doc['id']}")
                                    response.raise_for_status()
                                    full_doc = response.json()
                                    
                                    st.write("**Full Details:**")
                                    st.write(f"**Created:** {full_doc['created_at']}")
                                    st.write(f"**Updated:** {full_doc['updated_at']}")
                                    st.write("**Metadata:**")
                                    st.json(full_doc['metadata'])
                                except Exception as e:
                                    st.error(f"Error: {str(e)}")
                                    
            except Exception as e:
                st.error(f"Error: {str(e)}")
        else:
            st.warning("Please enter a search term")

else:  # Document List
    st.header("Document List")
    
    try:
        response = requests.get(f"{API_BASE_URL}/documents/")
        response.raise_for_status()
        documents = response.json()['documents']
        
        if not documents:
            st.info("No documents found")
        else:
            # Create DataFrame
            df = pd.DataFrame(documents)
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['updated_at'] = pd.to_datetime(df['updated_at'])
            
            # Filtering options
            col1, col2 = st.columns(2)
            with col1:
                category_filter = st.selectbox(
                    "Filter by Category",
                    ["All"] + list(df['category'].unique())
                )
            with col2:
                language_filter = st.selectbox(
                    "Filter by Language",
                    ["All"] + list(df['language'].unique())
                )
            
            # Apply filters
            if category_filter != "All":
                df = df[df['category'] == category_filter]
            if language_filter != "All":
                df = df[df['language'] == language_filter]
            
            # Show datatable
            st.dataframe(
                df[['id', 'title', 'file_type', 'language', 'category', 'created_at']],
                use_container_width=True
            )
            
    except Exception as e:
        st.error(f"Error: {str(e)}") 