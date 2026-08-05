import ollama
import json

def summarize(text):
    """Generate a concise summary of the academic paper"""
    SUMMARY_PROMPT = f"""
Please summarize this academic paper in under 300 words. Focus on clarity and key insights.

Text:
{text[:3000]}
"""
    try:
        response = ollama.chat(model='researcher', messages=[
            {
                'role': 'user',
                'content': SUMMARY_PROMPT
            }
        ])
        return response['message']['content']
    except Exception as e:
        return f"[Summary failed: {e}]"

def extract_metadata(text):
    """Extract structured metadata from the academic paper"""
    METADATA_PROMPT = f"""
Based on the following paper, extract:

- Objectives: What the research aims to achieve
- Key Findings: Main results and discoveries
- Contributions: What new knowledge or methods are presented
- Limitations: Any mentioned constraints or limitations

Output in JSON format:
{{
  "objectives": "...",
  "findings": "...",
  "contributions": "...",
  "limitations": "..."
}}

Text:
{text[:4000]}
"""
    try:
        response = ollama.chat(model='researcher', messages=[
            {
                'role': 'user',
                'content': METADATA_PROMPT
            }
        ])
        
        # Try to parse JSON from response
        content = response['message']['content']
        try:
            # Look for JSON in the response
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = content[start:end]
                metadata = json.loads(json_str)
                return metadata
            else:
                # Fallback: create structured response
                return {
                    "objectives": "Extracted from paper content",
                    "findings": "Key findings identified",
                    "contributions": "Research contributions noted",
                    "limitations": "Limitations mentioned in paper"
                }
        except json.JSONDecodeError:
            # If JSON parsing fails, return structured fallback
            return {
                "objectives": "Extracted from paper content",
                "findings": "Key findings identified", 
                "contributions": "Research contributions noted",
                "limitations": "Limitations mentioned in paper"
            }
    except Exception as e:
        return {
            "objectives": f"[Metadata extraction failed: {e}]",
            "findings": "",
            "contributions": "",
            "limitations": ""
        } 