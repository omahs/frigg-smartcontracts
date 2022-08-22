import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import UID_ABI from "./artifacts/UIDToken.json";
import USDC_ABI from "./artifacts/USDC.json";
import { formatUnits, parseUnits } from 'ethers/lib/utils';

describe("primaryRouter", function () {
  async function getContracts() {
    const [owner, addr1] = await ethers.getSigners();
    const MULTISIG = owner.address;

    const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const GOLDFINCH_UID = "0xba0439088dc1e75f58e0a7c107627942c15cbb41";

    const ATT = await ethers.getContractFactory("ATT");
    const PRIMARY_ROUTER = await ethers.getContractFactory("primaryRouter");
    const primaryRouter = await PRIMARY_ROUTER.deploy(MULTISIG);

    console.log("deployed router: ", primaryRouter.address);

    const att = await ATT.deploy(MULTISIG, primaryRouter.address);

    const tokenData = {
      outputTokenAddress: att.address,
      uIdContract: GOLDFINCH_UID,
      issuer: owner.address,
      issuancePrice: 1000000000000,
      expiryPrice: 500000000000,
      issuanceTokenAddress: USDC_ADDRESS,
    }

    return { att, primaryRouter, owner, addr1, USDC_ADDRESS, GOLDFINCH_UID, tokenData };
  }

  it("Add new Token to router contract", async function () {
    const { att, primaryRouter, owner, addr1, USDC_ADDRESS, GOLDFINCH_UID, tokenData } = await loadFixture(getContracts);
    
    await expect(primaryRouter.connect(addr1).add(tokenData.outputTokenAddress, tokenData.uIdContract, tokenData.issuer, tokenData.issuancePrice, tokenData.expiryPrice, tokenData.issuanceTokenAddress)).to.be.reverted;

    await primaryRouter.connect(owner).add(tokenData.outputTokenAddress, tokenData.uIdContract, tokenData.issuer, tokenData.issuancePrice, tokenData.expiryPrice, tokenData.issuanceTokenAddress)
    console.log(await primaryRouter.tokenData(att.address));
    
  });
  
  describe("Buy Token", function () {
    it("Should revert because inputToken needs to be > 0", async function () {
      const { att, primaryRouter } = await loadFixture(getContracts);
      await expect(primaryRouter.buy(att.address, 0)).to.be.revertedWith("You cannot buy with 0 token");
    });

    it("Should revert because account has no UID Token", async function () {
      const { att, primaryRouter } = await loadFixture(getContracts);
      await expect(primaryRouter.buy(att.address, 10)).to.be.reverted;
    });

    it("Mint UID Token", async function () {
      const { att, owner, primaryRouter, tokenData, USDC_ADDRESS, GOLDFINCH_UID } = await loadFixture(getContracts);

      const uidContract = new ethers.Contract(GOLDFINCH_UID, UID_ABI);
      const signer = await owner.signMessage("Test UID Token");

      const uid = await ethers.getImpersonatedSigner("0x335aE5dd1b3de7e80148B72Df0511167E2498187");

      await owner.sendTransaction({
        to: uid.address,
        value: ethers.utils.parseEther("1") // 1 ether
      })

      console.log(uid);
      

      await primaryRouter.add(tokenData.outputTokenAddress, tokenData.uIdContract, tokenData.issuer, tokenData.issuancePrice, tokenData.expiryPrice, tokenData.issuanceTokenAddress)
      
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI);

      await usdcContract.approve(uid.address, 10);

      await primaryRouter.connect(uid).buy(att.address, 10);
    });
  });
});