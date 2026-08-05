from web3 import Web3

class Web3App:
    def __init__(self):
        # Connect to local Ethereum node (Ganache)
        self.w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
        if not self.w3.isConnected():
            print("Failed to connect to the Ethereum network.")
        else:
            print("Connected to the Ethereum network.")

    def get_balance(self, address):
        balance = self.w3.eth.get_balance(address)
        return self.w3.fromWei(balance, 'ether')

if __name__ == "__main__":
    app = Web3App()
    # Example usage
    # Replace with a valid Ethereum address
    print(app.get_balance('0xYourEthereumAddressHere'))
