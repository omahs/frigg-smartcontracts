import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const MULTISIG = owner.address;

  const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  // Mainnet: 0xba0439088dc1e75f58e0a7c107627942c15cbb41, Goerli: 0x10e55306017e67e395Ee2fAC36e9DA82c04A556D
  const GOLDFINCH_UID = "0x10e55306017e67e395Ee2fAC36e9DA82c04A556D";

  const primaryRouterContract = await ethers.getContractFactory(
    "primaryRouter"
  );
  const attContract = await ethers.getContractFactory("ATT");

  const primaryRouter = await primaryRouterContract.deploy(MULTISIG);
  const att = await attContract.deploy(MULTISIG, primaryRouter.address);

  const tokenData = {
    outputTokenAddress: att.address,
    uIdContract: GOLDFINCH_UID,
    issuer: MULTISIG,
    issuancePrice: 1000000000000,
    expiryPrice: 666666666666,
    issuanceTokenAddress: USDC_ADDRESS,
  };

  await primaryRouter.deployed();
  await att.deployed();

  await primaryRouter.add(
    tokenData.outputTokenAddress,
    tokenData.uIdContract,
    tokenData.issuer,
    tokenData.issuancePrice,
    tokenData.expiryPrice,
    tokenData.issuanceTokenAddress
  );

  console.log(
    `Primary Router deployed: https://goerli.etherscan.io/address/${primaryRouter.address}`
  );
  console.log(
    `ATT Token deployed: https://goerli.etherscan.io/address/${att.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
