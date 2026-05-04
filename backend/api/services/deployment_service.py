import os
import subprocess
import json
from django.conf import settings
from typing import Dict, Any
from ..models import ContractProposal

def deploy_to_blockchain(proposal: ContractProposal) -> Dict[str, Any]:
    """
    Deploys the generated Solidity contract using Hardhat.
    """
    if not proposal.generated_code:
        return {"error": "No code generated for this proposal."}

    blockchain_dir = os.path.join(settings.BASE_DIR, '..', 'blockchain')
    contract_name = proposal.template.contract_name
    # Security: Ensure contract_name doesn't contain path traversal characters
    if not contract_name.isalnum():
         # Allow underscores but nothing else suspicious
         if not all(c.isalnum() or c == '_' for c in contract_name):
             return {"error": "Invalid contract name for deployment."}

    # Save as a unique file to avoid collisions
    file_name = f"Generated_{proposal.id}_{contract_name}.sol"
    file_path = os.path.join(blockchain_dir, 'contracts', file_name)

    try:
        # 1. Write the generated code to the blockchain contracts directory
        with open(file_path, 'w') as f:
            f.write(proposal.generated_code)

        # 2. Run Hardhat deployment script
        # We pass the contract name via environment variable
        env = os.environ.copy()
        # The contract name in the .sol file is the same as proposal.template.contract_name
        env["CONTRACT_NAME"] = contract_name

        result = subprocess.run(
            ["npx", "hardhat", "run", "scripts/deploy_generated.ts", "--network", "localhost"],
            cwd=blockchain_dir,
            capture_output=True,
            text=True,
            env=env,
            shell=True # Needed for npx on Windows
        )

        # 3. Parse output
        output = result.stdout
        error_output = result.stderr

        # Find the JSON line in the output
        json_output = None
        for line in output.splitlines():
            if line.startswith('{"status":'):
                json_output = json.loads(line)
                break

        if json_output and json_output.get("status") == "success":
            proposal.contract_address = json_output.get("address")
            proposal.transaction_hash = json_output.get("txHash")
            proposal.save()
            return json_output
        else:
            return {
                "error": "Deployment failed",
                "details": json_output.get("message") if json_output else error_output
            }

    except Exception as e:
        return {"error": str(e)}
    # finally:
    #     # Optional: Clean up the generated file
    #     if os.path.exists(file_path):
    #         os.remove(file_path)
