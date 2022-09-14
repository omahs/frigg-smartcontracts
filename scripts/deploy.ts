import { ethers } from "hardhat";
import { GOLDFINCH_UID_TESTNET, QUADRATA_UID_TESTNET, USDC_ADDRESS_TESTNET } from "../test/integration/constants";

async function main() {
  const routerGaterContract = await ethers.getContractFactory("routerGater");
  const primaryRouterContract = await ethers.getContractFactory("primaryRouter");
  const attContract = await ethers.getContractFactory("ATT");

  const ROUTER_MULTISIG = process.env.ROUTER_MULTISIG;
  const TOKEN_MULTISIG = process.env.TOKEN_MULTISIG;

  const routerGater = await routerGaterContract.deploy(ROUTER_MULTISIG, GOLDFINCH_UID_TESTNET, QUADRATA_UID_TESTNET);
  const primaryRouter = await primaryRouterContract.deploy(ROUTER_MULTISIG, routerGater.address);
  const att = await attContract.deploy(TOKEN_MULTISIG!, primaryRouter.address);

  // TODO In here as reference
  const tokenData = {
    outputTokenAddress: att.address,
    issuer: TOKEN_MULTISIG,
    issuancePrice: 1000000000000,
    expiryPrice: 666666666666,
    issuanceTokenAddress: USDC_ADDRESS_TESTNET,
  };

  await primaryRouter.deployed();
  await att.deployed();

  console.log(`Router Gater deployed: https://goerli.etherscan.io/address/${routerGater.address}`);
  console.log(`Primary Router deployed: https://goerli.etherscan.io/address/${primaryRouter.address}`);
  console.log(`ATT Token deployed: https://goerli.etherscan.io/address/${att.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
