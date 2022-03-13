require("@nomiclabs/hardhat-waffle");
const fs = require("fs")
const privateKey = fs.readFileSync(".secret").toString();
const projectId = "f58da0c1f04e4013b61956c96f6f8102"

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url:`https://polygon-mumbai.infura.io/v3/f58da0c1f04e4013b61956c96f6f8102`,
      accounts: [privateKey]
    },
    mainnet: {
      url:`https://polygon-mainnet.infura.io/v3/f58da0c1f04e4013b61956c96f6f8102`,
      accounts: [privateKey]
    },
  },
  solidity: "0.8.4",
};
