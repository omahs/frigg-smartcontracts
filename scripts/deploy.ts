import { ethers } from "hardhat";
import { GOLDFINCH_UID_TESTNET, USDC_ADDRESS_TESTNET } from "../test/integration/constants";

async function main() {
  const [owner] = await ethers.getSigners();

  const MULTISIG = owner.address;

  const primaryRouterContract = await ethers.getContractFactory("primaryRouter");
  const attContract = await ethers.getContractFactory("ATT");

  const primaryRouter = await primaryRouterContract.deploy(MULTISIG);
  const att = await attContract.deploy(MULTISIG, primaryRouter.address);

  const tokenData = {
    outputTokenAddress: att.address,
    uIdContract: GOLDFINCH_UID_TESTNET,
    issuer: MULTISIG,
    issuancePrice: 1000000000000,
    expiryPrice: 666666666666,
    issuanceTokenAddress: USDC_ADDRESS_TESTNET,
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

  console.log(`Primary Router deployed: https://goerli.etherscan.io/address/${primaryRouter.address}`);
  console.log(`ATT Token deployed: https://goerli.etherscan.io/address/${att.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
