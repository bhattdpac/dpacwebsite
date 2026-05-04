import { ethers } from "hardhat";

async function main() {
  const contractName = process.env.CONTRACT_NAME || "PaymentEscrow";
  
  console.log(`Deploying ${contractName}...`);

  const Contract = await ethers.getContractFactory(contractName);
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash;

  console.log(JSON.stringify({
    status: "success",
    address: address,
    txHash: txHash
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "error",
    message: error.message
  }));
  process.exitCode = 1;
});
