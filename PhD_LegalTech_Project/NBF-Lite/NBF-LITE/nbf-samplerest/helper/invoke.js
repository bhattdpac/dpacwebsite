
'use strict';

const { throws } = require('assert');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
// const { toString } = require('pdfkit');

async function invoke(fcn,args,user,Contract,channel,cfgpath,local,mspId) {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, cfgpath);
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(),"wallet/"+ mspId);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(user);
        if (!identity) {
            console.log('An identity for the user "" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            throws;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: local, asLocalhost: local } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channel);

        // Get the contract from the network.
        const contract = network.getContract(Contract);
        console.log(args,args.length)

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
        var result=await contract.submitTransaction(fcn,JSON.stringify(args)); // to be done generic
        console.log('Transaction has been submitted',result.toString());
        console.log(result.toString('utf8'))
        // Disconnect from the gateway.
        await gateway.disconnect();
        return JSON.stringify({"result":result.toString(),"sFlag":true})
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        return JSON.stringify({"error":error,"sFlag":false})
        // process.exit(1);
    }
}

exports.invoke=invoke;
