import sys
import time

print("Loading transformers and torch...")
start = time.time()
from transformers import AutoTokenizer, AutoModel
import torch
print(f"Loaded in {time.time() - start:.2f} seconds.")

model_name = "law-ai/InCaseLawBERT"
print(f"Loading tokenizer for {model_name}...")
tokenizer = AutoTokenizer.from_pretrained(model_name)

print(f"Loading model for {model_name}...")
model = AutoModel.from_pretrained(model_name)

# Sample Indian legal case citation
clause = "The appellant relied on the division bench judgment in the case of State of Bombay v. F.N. Balsara."
print(f"\nProcessing Clause: '{clause}'")

# Tokenize
inputs = tokenizer(clause, return_tensors="pt")
print("\nTokenization output (tokens):")
tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
print(tokens)

# Run model inference (forward pass)
print("\nRunning model inference...")
with torch.no_grad():
    outputs = model(**inputs)

# Extract embedding shape
last_hidden_states = outputs.last_hidden_state
print(f"Output embeddings shape: {last_hidden_states.shape} (batch_size, sequence_length, hidden_dimension)")
print("Verification SUCCESS: Indian Case Law BERT (InCaseLawBERT) loaded and executed successfully!")
