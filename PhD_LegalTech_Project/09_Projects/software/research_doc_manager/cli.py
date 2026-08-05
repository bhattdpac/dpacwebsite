import click
import requests
import json
import os
from typing import Optional

API_BASE_URL = "http://localhost:8000/api/v1"

@click.group()
def cli():
    """Research Document Manager CLI"""
    pass

@cli.command()
@click.argument('file_path')
def upload(file_path: str):
    """Upload a document"""
    if not os.path.exists(file_path):
        click.echo(f"Error: File {file_path} not found")
        return
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(f"{API_BASE_URL}/upload/", files=files)
            response.raise_for_status()
            result = response.json()
            click.echo(f"Success: Document uploaded (ID: {result['id']})")
    except Exception as e:
        click.echo(f"Error: {str(e)}")

@cli.command()
@click.argument('query')
@click.option('--category', help='Filter by category')
@click.option('--language', help='Filter by language')
def search(query: str, category: Optional[str], language: Optional[str]):
    """Search in documents"""
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
            click.echo("No results found")
            return
            
        for doc in results:
            click.echo(f"\nTitle: {doc['title']}")
            click.echo(f"ID: {doc['id']}")
            click.echo(f"Abstract: {doc['abstract'][:200]}...")
            click.echo("-" * 50)
            
    except Exception as e:
        click.echo(f"Error: {str(e)}")

@cli.command()
@click.argument('doc_id')
def get(doc_id: str):
    """Get document information"""
    try:
        response = requests.get(f"{API_BASE_URL}/documents/{doc_id}")
        response.raise_for_status()
        doc = response.json()
        
        click.echo(f"\nTitle: {doc['title']}")
        click.echo(f"File Type: {doc['file_type']}")
        click.echo(f"Language: {doc['language']}")
        click.echo(f"Category: {doc['category'] or 'Not specified'}")
        click.echo(f"Created: {doc['created_at']}")
        click.echo(f"Updated: {doc['updated_at']}")
        click.echo("\nAbstract:")
        click.echo(doc['abstract'])
        click.echo("-" * 50)
        
    except Exception as e:
        click.echo(f"Error: {str(e)}")

@cli.command()
@click.argument('doc_id')
def delete(doc_id: str):
    """Delete a document"""
    try:
        response = requests.delete(f"{API_BASE_URL}/documents/{doc_id}")
        response.raise_for_status()
        click.echo(f"Success: Document {doc_id} deleted")
    except Exception as e:
        click.echo(f"Error: {str(e)}")

if __name__ == '__main__':
    cli() 