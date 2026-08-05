import os
import solcx
from solcx import compile_source, install_solc
import json

# Helper to extract opcodes from bytecode (simple disassembler)
def get_opcodes(bytecode):
    # Remove 0x prefix if present
    if bytecode.startswith('0x'):
        bytecode = bytecode[2:]
    # EVM opcodes are 2 hex chars each
    opcodes = [bytecode[i:i+2] for i in range(0, len(bytecode), 2)]
    return opcodes

def load_solidity_files(directory):
    contracts = []
    for filename in os.listdir(directory):
        if filename.endswith('.sol'):
            with open(os.path.join(directory, filename), 'r', encoding='utf-8') as f:
                contracts.append({'filename': filename, 'source': f.read()})
    return contracts

def compile_contract(source_code, solc_version='0.8.6'):
    try:
        install_solc(solc_version)
        solcx.set_solc_version(solc_version)
        compiled = compile_source(
            source_code,
            output_values=['abi', 'bin'],
        )
        # Get first contract in the source
        contract_id, contract_interface = next(iter(compiled.items()))
        abi = contract_interface['abi']
        bytecode = contract_interface['bin']
        return abi, bytecode
    except Exception as e:
        print(f"Compilation error: {e}")
        return None, None

def parse_contracts(directory, solc_version='0.8.6'):
    contracts = load_solidity_files(directory)
    results = []
    for contract in contracts:
        abi, bytecode = compile_contract(contract['source'], solc_version)
        if bytecode:
            opcodes = get_opcodes(bytecode)
        else:
            opcodes = []
        results.append({
            'filename': contract['filename'],
            'source': contract['source'],
            'abi': abi,
            'bytecode': bytecode,
            'opcodes': opcodes
        })
    return results

def main():
    # Example usage: parse all contracts in 'contracts' directory
    directory = 'contracts'  # You should create and populate this directory with .sol files
    results = parse_contracts(directory)
    for res in results:
        print(f"Contract: {res['filename']}")
        print(f"Source (first 100 chars): {res['source'][:100]}")
        print(f"Bytecode (first 40 chars): {str(res['bytecode'])[:40]}")
        print(f"Opcodes (first 10): {res['opcodes'][:10]}")
        print()

if __name__ == '__main__':
    main() 