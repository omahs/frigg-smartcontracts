import { smock } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai, { expect } from "chai";
import chaiString from 'chai-string';
import { ethers } from "hardhat";
import USDC_ABI from "./artifacts/USDC.json";

chai.use(chaiString);
chai.use(smock.matchers);

describe("primaryRouter", function () {
  async function getContracts() {
    const [owner, addr1] = await ethers.getSigners();
    const MULTISIG = owner.address;

    const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const GOLDFINCH_UID = "0xba0439088dc1e75f58e0a7c107627942c15cbb41";

    const ATT = await ethers.getContractFactory("ATT");
    const PRIMARY_ROUTER = await ethers.getContractFactory("primaryRouter");
    const primaryRouter = await PRIMARY_ROUTER.deploy(MULTISIG);

    const att = await ATT.deploy(MULTISIG, primaryRouter.address);

    const tokenData = {
      outputTokenAddress: att.address,
      uIdContract: GOLDFINCH_UID,
      issuer: owner.address,
      issuancePrice: 1000000000000,
      expiryPrice: 500000000000,
      issuanceTokenAddress: USDC_ADDRESS,
    }

    const myContractFake = await smock.fake(att);

    const uidAccount = await ethers.getImpersonatedSigner("0x335aE5dd1b3de7e80148B72Df0511167E2498187");

    return { att, primaryRouter, owner, addr1, USDC_ADDRESS, GOLDFINCH_UID, tokenData, myContractFake, uidAccount };
  }

  it("Should add new Token to router contract", async function () {
    const { att, primaryRouter, owner, addr1, tokenData } = await loadFixture(getContracts);

    await expect(primaryRouter.connect(addr1).add(tokenData.outputTokenAddress, tokenData.uIdContract, tokenData.issuer, tokenData.issuancePrice, tokenData.expiryPrice, tokenData.issuanceTokenAddress)).to.be.reverted;

    await primaryRouter.connect(owner).add(tokenData.outputTokenAddress, tokenData.uIdContract, tokenData.issuer, tokenData.issuancePrice, tokenData.expiryPrice, tokenData.issuanceTokenAddress)
    const data = await primaryRouter.tokenData(att.address);

    expect(tokenData.issuer).to.equalIgnoreCase(data['issuer']);
    expect(tokenData.uIdContract).to.equalIgnoreCase(data['uIdContract']);
    expect(tokenData.issuancePrice).to.equal(ethers.BigNumber.from(data['issuancePrice']).toNumber());
    expect(tokenData.expiryPrice).to.equal(ethers.BigNumber.from(data['expiryPrice']).toNumber());
    expect(tokenData.issuanceTokenAddress).to.equalIgnoreCase(data['issuanceTokenAddress']);
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

    it("Should revert because primary Market is not active", async function () {
      const { primaryRouter, myContractFake } = await loadFixture(getContracts);
      myContractFake.isPrimaryMarketActive.returns(false)
      await expect(primaryRouter.buy(myContractFake.address, 10)).to.be.reverted;
    });

    it("Transfer Token to buyer", async function () {
      const { att, owner, primaryRouter, tokenData, USDC_ADDRESS, uidAccount } = await loadFixture(getContracts);

      await owner.sendTransaction({
        to: uidAccount.address,
        value: ethers.utils.parseEther("1")
      });

      await primaryRouter.add(tokenData.outputTokenAddress, tokenData.uIdContract, tokenData.issuer, tokenData.issuancePrice, tokenData.expiryPrice, tokenData.issuanceTokenAddress)

      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI);

      await usdcContract.connect(uidAccount).approve(primaryRouter.address, 100000000);

      await primaryRouter.connect(uidAccount).buy(att.address, 1);

      await expect(primaryRouter.connect(uidAccount).buy(att.address, 1))
        .to.emit(primaryRouter, "SuccessfulPurchase")
        .withArgs(uidAccount.address, tokenData.outputTokenAddress, 1);
    });
  });

  describe("Sell Token", function () {
    it("Should revert because inputToken needs to be > 0", async function () {
      const { att, primaryRouter } = await loadFixture(getContracts);
      await expect(primaryRouter.sell(att.address, 0)).to.be.revertedWith("You cannot sell 0 token");
    });

    it("Should revert because account has no UID Token", async function () {
      const { att, primaryRouter } = await loadFixture(getContracts);
      await expect(primaryRouter.sell(att.address, 10)).to.be.reverted;
    });

    it("Should revert because expiry date is not active", async function () {
      const { att, primaryRouter, uidAccount } = await loadFixture(getContracts);
      await expect(primaryRouter.connect(uidAccount).sell(att.address, 10)).to.be.reverted;
    });

    it("Transfer Token to issuer", async function () {
      const { att, owner, primaryRouter, tokenData, USDC_ADDRESS, uidAccount } = await loadFixture(getContracts);

      await primaryRouter.add(tokenData.outputTokenAddress, tokenData.uIdContract, tokenData.issuer, tokenData.issuancePrice, tokenData.expiryPrice, tokenData.issuanceTokenAddress)

      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI);

      await usdcContract.connect(uidAccount).approve(primaryRouter.address, 100000000);
      await usdcContract.connect(uidAccount).approve(att.address, 1000000000000);

      await primaryRouter.connect(uidAccount).buy(att.address, 1);

      await att.setBondExpiry();

      await primaryRouter.connect(uidAccount).sell(att.address, 1);

      await expect(primaryRouter.connect(uidAccount).sell(att.address, 1))
        .to.emit(primaryRouter, "SuccessfulExpiration")
        .withArgs(uidAccount.address, tokenData.outputTokenAddress, 1);
    });
  });
});