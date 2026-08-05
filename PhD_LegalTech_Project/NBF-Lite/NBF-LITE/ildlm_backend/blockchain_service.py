import asyncio
import os
from hfc.fabric.client import Client

class BlockchainService:
    def __init__(self):
        # Path to the connection profile within the Docker container
        self.ccp_path = "/app/crypto-config/connection-profile.json"
        self.client = Client(net_profile=self.ccp_path)
        self.user = None

    def get_user(self, name='admin', org='org1'):
        """
        Retrieves a user object from the client's state store.
        """
        try:
            self.user = self.client.get_user(org_name=org, name=name)
            if not self.user:
                raise ValueError("User not found")
            return self.user
        except Exception as e:
            print(f"Error getting user: {e}")
            return None

    async def get_blockchain_info(self):
        """
        Connects to a peer and retrieves basic blockchain information.
        """
        if not self.user:
            self.get_user()
        
        if not self.user:
            return {"error": "Could not get user for blockchain interaction"}

        try:
            # The loop should be the one that the client is using
            loop = asyncio.get_event_loop()
            
            # Get blockchain info from the first peer in the network
            response = await self.client.query_info(
                requestor=self.user,
                peers=['peer0.org1.example.com'],
                decode=True,
                loop=loop
            )
            return response
        except Exception as e:
            return {"error": str(e)}

# Singleton instance
blockchain_service = BlockchainService()