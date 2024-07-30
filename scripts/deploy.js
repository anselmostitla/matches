const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy FeeProxy contract
  const FeeProxy = await ethers.getContractFactory("FeeProxy");
  const feeProxy = await FeeProxy.deploy();
  await feeProxy.deployed();
  console.log("FeeProxy deployed to:", feeProxy.address);

  // Deploy SportBettings contract
  const SportBettings = await ethers.getContractFactory("SportBettings");
  const sportBettings = await SportBettings.deploy(feeProxy.address);
  await sportBettings.deployed();
  console.log("SportBettings deployed to:", sportBettings.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat compile
// npx hardhat test  // but in hardhat.config.js comment --> // defaultNetwork: `${process.env.DEFAULT_NETWORK_NAME}`
// npx hardhat run scripts/deploy.js --network sepolia