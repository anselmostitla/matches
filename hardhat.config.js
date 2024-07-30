require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    mumbai: {
      url:process.env.POLYGON_MUMBAI_URL,
      accounts:[`0x${process.env.POLYGON_MUMBAI_SECRET_KEY}`]
    },
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [`0x${process.env.SEPOLIA_SECRET_KEY}`]
    },
  },

  etherscan: {
    apiKey: {
      sepolia: process.env.SEPOLIASCAN_API_KEY
    }
  }
  // defaultNetwork: `${process.env.DEFAULT_NETWORK_NAME}`
};
