const Web3 = require('web3');
const contractABI = require('./build/contracts/SimpleStorage.json').abi;
const contractAddress = 'YOUR_CONTRACT_ADDRESS'; // Replace with your deployed contract address

const web3 = new Web3('http://127.0.0.1:7545'); // Ganache default RPC server

const simpleStorage = new web3.eth.Contract(contractABI, contractAddress);

async function interact() {
    const accounts = await web3.eth.getAccounts();

    // Set a value
    await simpleStorage.methods.set(42).send({ from: accounts[0] });
    console.log('Value set to 42');

    // Get the value
    const value = await simpleStorage.methods.get().call();
    console.log('Stored value is:', value);
}

interact();
