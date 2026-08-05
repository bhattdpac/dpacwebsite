
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const { throws } = require('assert');


async function query(fcn,args,user,Contract,channel,cfgpath,local,mspId) {
    try {
        // load the network configuration
        console.log(user)
        const ccpPath = path.resolve(__dirname, cfgpath);
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(),"wallet/"+mspId);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(user);
        if (!identity) {
            console.log('An identity for the user',user,' does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            throws ;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: local, asLocalhost: local } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channel);

        // Get the contract from the network.
        const contract = network.getContract(Contract);

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction(fcn,...args);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();
        return JSON.stringify(result.toString()) 
        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return JSON.stringify({error})
        process.exit(1);
    }
}

// main();
exports.query=query;
