import sys
import os
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                            QHBoxLayout, QPushButton, QLabel, QFileDialog, 
                            QLineEdit, QComboBox, QTableWidget, QTableWidgetItem,
                            QMessageBox, QTabWidget)
from PyQt6.QtCore import Qt
import requests
import pandas as pd
from datetime import datetime

API_BASE_URL = "http://localhost:8000/api/v1"

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Research Document Manager")
        self.setMinimumSize(800, 600)
        
        # Create central widget and layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        
        # Create tab widget
        tabs = QTabWidget()
        layout.addWidget(tabs)
        
        # Create tabs
        upload_tab = self.create_upload_tab()
        search_tab = self.create_search_tab()
        documents_tab = self.create_documents_tab()
        
        # Add tabs to widget
        tabs.addTab(upload_tab, "Upload Document")
        tabs.addTab(search_tab, "Search Documents")
        tabs.addTab(documents_tab, "Document List")
        
    def create_upload_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # File selection
        file_layout = QHBoxLayout()
        self.file_label = QLabel("No file selected")
        select_button = QPushButton("Select File")
        select_button.clicked.connect(self.select_file)
        file_layout.addWidget(self.file_label)
        file_layout.addWidget(select_button)
        layout.addLayout(file_layout)
        
        # Upload button
        upload_button = QPushButton("Upload Document")
        upload_button.clicked.connect(self.upload_document)
        layout.addWidget(upload_button)
        
        layout.addStretch()
        return widget
        
    def create_search_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Search input
        search_layout = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Enter search term")
        search_button = QPushButton("Search")
        search_button.clicked.connect(self.search_documents)
        search_layout.addWidget(self.search_input)
        search_layout.addWidget(search_button)
        layout.addLayout(search_layout)
        
        # Filters
        filter_layout = QHBoxLayout()
        self.category_filter = QComboBox()
        self.category_filter.addItem("All Categories")
        self.language_filter = QComboBox()
        self.language_filter.addItem("All Languages")
        filter_layout.addWidget(QLabel("Category:"))
        filter_layout.addWidget(self.category_filter)
        filter_layout.addWidget(QLabel("Language:"))
        filter_layout.addWidget(self.language_filter)
        layout.addLayout(filter_layout)
        
        # Results table
        self.search_results = QTableWidget()
        self.search_results.setColumnCount(5)
        self.search_results.setHorizontalHeaderLabels(["ID", "Title", "Category", "Language", "File Type"])
        layout.addWidget(self.search_results)
        
        return widget
        
    def create_documents_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Filters
        filter_layout = QHBoxLayout()
        self.doc_category_filter = QComboBox()
        self.doc_category_filter.addItem("All Categories")
        self.doc_language_filter = QComboBox()
        self.doc_language_filter.addItem("All Languages")
        filter_layout.addWidget(QLabel("Category:"))
        filter_layout.addWidget(self.doc_category_filter)
        filter_layout.addWidget(QLabel("Language:"))
        filter_layout.addWidget(self.doc_language_filter)
        layout.addLayout(filter_layout)
        
        # Documents table
        self.documents_table = QTableWidget()
        self.documents_table.setColumnCount(6)
        self.documents_table.setHorizontalHeaderLabels(
            ["ID", "Title", "Category", "Language", "File Type", "Created At"]
        )
        layout.addWidget(self.documents_table)
        
        # Refresh button
        refresh_button = QPushButton("Refresh List")
        refresh_button.clicked.connect(self.refresh_documents)
        layout.addWidget(refresh_button)
        
        return widget
        
    def select_file(self):
        file_name, _ = QFileDialog.getOpenFileName(
            self,
            "Select Document",
            "",
            "Documents (*.pdf *.png *.jpg *.jpeg)"
        )
        if file_name:
            self.file_label.setText(os.path.basename(file_name))
            self.selected_file = file_name
            
    def upload_document(self):
        if not hasattr(self, 'selected_file'):
            QMessageBox.warning(self, "Error", "Please select a file first")
            return
            
        try:
            with open(self.selected_file, 'rb') as f:
                files = {'file': f}
                response = requests.post(f"{API_BASE_URL}/upload/", files=files)
                response.raise_for_status()
                result = response.json()
                QMessageBox.information(self, "Success", f"Document uploaded successfully (ID: {result['id']})")
                self.file_label.setText("No file selected")
                delattr(self, 'selected_file')
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to upload document: {str(e)}")
            
    def search_documents(self):
        query = self.search_input.text()
        if not query:
            QMessageBox.warning(self, "Warning", "Please enter a search term")
            return
            
        try:
            params = {'query': query}
            if self.category_filter.currentText() != "All Categories":
                params['category'] = self.category_filter.currentText()
            if self.language_filter.currentText() != "All Languages":
                params['language'] = self.language_filter.currentText()
                
            response = requests.get(f"{API_BASE_URL}/search/", params=params)
            response.raise_for_status()
            results = response.json()['results']
            
            self.search_results.setRowCount(len(results))
            for i, doc in enumerate(results):
                self.search_results.setItem(i, 0, QTableWidgetItem(doc['id']))
                self.search_results.setItem(i, 1, QTableWidgetItem(doc['title']))
                self.search_results.setItem(i, 2, QTableWidgetItem(doc['category'] or ''))
                self.search_results.setItem(i, 3, QTableWidgetItem(doc['language']))
                self.search_results.setItem(i, 4, QTableWidgetItem(doc['file_type']))
                
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Search failed: {str(e)}")
            
    def refresh_documents(self):
        try:
            response = requests.get(f"{API_BASE_URL}/documents/")
            response.raise_for_status()
            documents = response.json()['documents']
            
            # Update filters
            categories = set(doc['category'] for doc in documents if doc['category'])
            languages = set(doc['language'] for doc in documents if doc['language'])
            
            self.doc_category_filter.clear()
            self.doc_category_filter.addItem("All Categories")
            self.doc_category_filter.addItems(categories)
            
            self.doc_language_filter.clear()
            self.doc_language_filter.addItem("All Languages")
            self.doc_language_filter.addItems(languages)
            
            # Update table
            self.documents_table.setRowCount(len(documents))
            for i, doc in enumerate(documents):
                self.documents_table.setItem(i, 0, QTableWidgetItem(doc['id']))
                self.documents_table.setItem(i, 1, QTableWidgetItem(doc['title']))
                self.documents_table.setItem(i, 2, QTableWidgetItem(doc['category'] or ''))
                self.documents_table.setItem(i, 3, QTableWidgetItem(doc['language']))
                self.documents_table.setItem(i, 4, QTableWidgetItem(doc['file_type']))
                self.documents_table.setItem(i, 5, QTableWidgetItem(doc['created_at']))
                
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to refresh documents: {str(e)}")

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec()) 