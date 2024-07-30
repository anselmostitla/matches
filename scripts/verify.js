const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const feeProxyAddress = "0x04a57c68D1addd1D1071F637BD710aE6746B165F";
  const sportBettingsAddress = "0xD892Dae9fdD0D8Aeb73546C1584634BacBC73754";

  console.log("Verifying FeeProxy at address:", feeProxyAddress);
  await hre.run("verify:verify", {
    address: feeProxyAddress
  });

  console.log("Verifying SportBettings at address:", sportBettingsAddress);
  await hre.run("verify:verify", {
    address: sportBettingsAddress,
    constructorArguments: [feeProxyAddress]
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/* 
$ npx hardhat run scripts/verify.js --network sepolia
Verifying FeeProxy at address: 0x04a57c68D1addd1D1071F637BD710aE6746B165F
Nothing to compile
Successfully submitted source code for contract
contracts/FeeProxy.sol:FeeProxy at 0x04a57c68D1addd1D1071F637BD710aE6746B165F
for verification on the block explorer. Waiting for verification result...

Successfully verified contract FeeProxy on Etherscan.
https://sepolia.etherscan.io/address/0x04a57c68D1addd1D1071F637BD710aE6746B165F#code
Verifying SportBettings at address: 0xD892Dae9fdD0D8Aeb73546C1584634BacBC73754
Compiled 2 Solidity files successfully (evm target: paris).
Successfully submitted source code for contract
contracts/SportBettings.sol:SportBettings at 0xD892Dae9fdD0D8Aeb73546C1584634BacBC73754
for verification on the block explorer. Waiting for verification result...

Successfully verified contract SportBettings on Etherscan.
https://sepolia.etherscan.io/address/0xD892Dae9fdD0D8Aeb73546C1584634BacBC73754#code
*/