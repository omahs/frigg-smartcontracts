import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage"

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          outputSelection: {
            "*": {
              "*": ["storageLayout"]
            }
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
      },
    }
  },
};

export default config;
