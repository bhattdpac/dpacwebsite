import argparse
from web3_app import Web3App

def main():
    app = Web3App()
    
    parser = argparse.ArgumentParser(description='Web3 Application CLI')
    parser.add_argument('--balance', type=str, help='Get balance of an Ethereum address')
    
    args = parser.parse_args()
    
    if args.balance:
        balance = app.get_balance(args.balance)
        print(f"Balance: {balance} ETH")

if __name__ == "__main__":
    main()
