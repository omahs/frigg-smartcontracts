import { ethers } from "hardhat";

async function main() {
  const routerGaterContract = await ethers.getContractFactory("routerGater");
  const primaryRouterContract = await ethers.getContractFactory("primaryRouter");
  const attContract = await ethers.getContractFactory("ATT");

  const ROUTER_MULTISIG = process.env.ROUTER_MULTISIG;
  const TOKEN_MULTISIG = process.env.TOKEN_MULTISIG;
  const GOLDFINCH_UID = process.env.GOLDFINCH_UID
  const QUADRATA_UID = process.env.QUADRATA_UID
  const USDC_ADDRESS = process.env.USDC_ADDRESS

  const routerGater = await routerGaterContract.deploy(ROUTER_MULTISIG, GOLDFINCH_UID, QUADRATA_UID);
  const primaryRouter = await primaryRouterContract.deploy(ROUTER_MULTISIG, routerGater.address);
  const att = await attContract.deploy(TOKEN_MULTISIG!, primaryRouter.address);

  // TODO In here as reference
  const tokenData = {
    outputTokenAddress: att.address,
    issuer: TOKEN_MULTISIG,
    issuancePrice: 1000000000000,
    expiryPrice: 666666666666,
    issuanceTokenAddress: USDC_ADDRESS,
  };

  await primaryRouter.deployed();
  await att.deployed();

  console.log(`Router Gater deployed: ${process.env.ETHERSCAN_URL}address/${routerGater.address}`);
  console.log(`Primary Router deployed: ${process.env.ETHERSCAN_URL}address/${primaryRouter.address}`);
  console.log(`ATT Token deployed: ${process.env.ETHERSCAN_URL}address/${att.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
