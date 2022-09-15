import { smock } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai, { expect } from "chai";
import chaiString from "chai-string";
import { ethers } from "hardhat";
import USDC_ABI from "../integration/_artifacts/USDC.json";
import { GOLDFINCH_UID, QUADRATA_UID, USDC_ADDRESS } from "./constants";

chai.use(chaiString);
chai.use(smock.matchers);

// Integration Tests for primaryRouter.sol
describe("primaryRouter", function () {
  /*
    Method that runs before each test, gets "chached" with loadFixture(getContractsFixture)
    Basic Setup of our smartcontracts (ATT.sol & primaryRouter.sol)
  */
  async function getContractsFixture() {
    const [owner, addr1] = await ethers.getSigners();
    const MULTISIG = owner.address;

    const ATT = await ethers.getContractFactory("ATT");
    const PRIMARY_ROUTER = await ethers.getContractFactory("primaryRouter");
    const ROUTER_GATER = await ethers.getContractFactory("routerGater");

    const routerGater = await ROUTER_GATER.deploy(MULTISIG, GOLDFINCH_UID, QUADRATA_UID);
    const primaryRouter = await PRIMARY_ROUTER.deploy(MULTISIG, routerGater.address);
    const att = await ATT.deploy(MULTISIG, primaryRouter.address);

    const tokenData = {
      outputTokenAddress: att.address,
      issuer: owner.address,
      issuancePrice: 1000000000000,
      expiryPrice: 666666666666,
      issuanceTokenAddress: USDC_ADDRESS,
    };

    const myContractFake = await smock.fake(att);

    const uidAccount = await ethers.getImpersonatedSigner("0x335aE5dd1b3de7e80148B72Df0511167E2498187");

    await owner.sendTransaction({
      to: uidAccount.address,
      value: ethers.utils.parseEther("50"),
    });

    return {
      att,
      routerGater,
      primaryRouter,
      owner,
      addr1,
      tokenData,
      myContractFake,
      uidAccount,
    };
  }

  // Testing the behaviour of the contract function "add"
  describe("Add Token", function () {
    // Test if the add function can be called by non-admins
    it("Should revert because caller is not admin", async function () {
      const { addr1, primaryRouter, tokenData } = await loadFixture(getContractsFixture);
      await expect(
        primaryRouter
          .connect(addr1)
          .add(
            tokenData.outputTokenAddress,
            tokenData.issuer,
            tokenData.issuancePrice,
            tokenData.expiryPrice,
            tokenData.issuanceTokenAddress
          )
      ).to.be.reverted;
    });

    // Test if the add function can be called by non-admins of outputToken
    it("Should revert because caller is not admin of outputToken", async function () {
      const { primaryRouter, tokenData, myContractFake } = await loadFixture(getContractsFixture);
      await expect(
        primaryRouter.add(
          myContractFake.address,
          tokenData.issuer,
          tokenData.issuancePrice,
          tokenData.expiryPrice,
          tokenData.issuanceTokenAddress
        )
      ).to.be.revertedWith("only admins and only Frigg-issued tokens can be added the token to this router");
    });

    // Test if a new token can be added to the router contract
    it("Should add new Token to router contract", async function () {
      const { att, primaryRouter, tokenData } = await loadFixture(getContractsFixture);

      await primaryRouter.add(
        tokenData.outputTokenAddress,
        tokenData.issuer,
        tokenData.issuancePrice,
        tokenData.expiryPrice,
        tokenData.issuanceTokenAddress
      );
      const data = await primaryRouter.tokenData(att.address);

      // Checks if the stored struct is indentical to our defined data object
      expect(tokenData.issuer).to.equalIgnoreCase(data["issuer"]);
      expect(tokenData.issuancePrice).to.equal(ethers.BigNumber.from(data["issuancePrice"]).toNumber());
      expect(tokenData.expiryPrice).to.equal(ethers.BigNumber.from(data["expiryPrice"]).toNumber());
      expect(tokenData.issuanceTokenAddress).to.equalIgnoreCase(data["issuanceTokenAddress"]);
    });
  });

  // Testing the behaviour of the contract function "buy"
  describe("Buy Token", function () {
    // Test if the buy function can be called with 0 amount of tokens
    it("Should revert because inputToken needs to be > 0", async function () {
      const { att, primaryRouter } = await loadFixture(getContractsFixture);
      await expect(primaryRouter.buy(att.address, 0, { value: ethers.utils.parseEther("0.0024") })).to.be.revertedWith(
        "You cannot buy with 0 token"
      );
    });

    // Test if the buy function can be called without a valid UID Token
    it("Should revert because account has no UID Token", async function () {
      const { att, primaryRouter } = await loadFixture(getContractsFixture);
      await expect(primaryRouter.buy(att.address, 10, { value: ethers.utils.parseEther("0.0024") })).to.be.reverted;
    });

    // Test if the buy function can be called when primary market isn't active
    it("Should revert because primary Market is not active", async function () {
      const { primaryRouter, myContractFake } = await loadFixture(getContractsFixture);
      myContractFake.isPrimaryMarketActive.returns(false);
      await expect(primaryRouter.buy(myContractFake.address, 10, { value: ethers.utils.parseEther("0.0024") })).to.be
        .reverted;
    });

    // Test if the buy function can be called without any erc20 allowance
    it("Should revert because spender has no allowance", async function () {
      const { att, primaryRouter, tokenData, uidAccount } = await loadFixture(getContractsFixture);
      await primaryRouter.add(
        tokenData.outputTokenAddress,
        tokenData.issuer,
        tokenData.issuancePrice,
        tokenData.expiryPrice,
        tokenData.issuanceTokenAddress
      );
      await expect(primaryRouter.connect(uidAccount).buy(att.address, 1, { value: ethers.utils.parseEther("0.0024") }))
        .to.be.reverted;
    });

    // Test if the buy function transfers the tokens to the recipient & emits a 'SuccessfulPurchase' Event
    it("Transfer Token to buyer", async function () {
      const { att, primaryRouter, tokenData, uidAccount } = await loadFixture(getContractsFixture);
      await primaryRouter.add(
        tokenData.outputTokenAddress,
        tokenData.issuer,
        tokenData.issuancePrice,
        tokenData.expiryPrice,
        tokenData.issuanceTokenAddress
      );
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI);
      await usdcContract.connect(uidAccount).approve(primaryRouter.address, 100000000);
      await primaryRouter.connect(uidAccount).buy(att.address, 1, { value: ethers.utils.parseEther("0.0024") });
      await expect(primaryRouter.connect(uidAccount).buy(att.address, 1, { value: ethers.utils.parseEther("0.0024") }))
        .to.emit(primaryRouter, "SuccessfulPurchase")
        .withArgs(uidAccount.address, tokenData.outputTokenAddress, 1);
    });
  });

  // Testing the behaviour of the contract function "sell"
  describe("Sell Token", function () {
    // Test if the sell function can be called with 0 amount of tokens
    it("Should revert because inputToken needs to be > 0", async function () {
      const { att, primaryRouter } = await loadFixture(getContractsFixture);
      await expect(primaryRouter.sell(att.address, 0, { value: ethers.utils.parseEther("0.0024") })).to.be.revertedWith(
        "You cannot sell 0 token"
      );
    });

    // Test if the sell function can be called without a valid UID Token
    it("Should revert because account has no UID Token", async function () {
      const { att, primaryRouter } = await loadFixture(getContractsFixture);
      await expect(primaryRouter.sell(att.address, 10, { value: ethers.utils.parseEther("0.0024") })).to.be.reverted;
    });

    // Test if the sell function can be called when the bond hasn't been expired yet
    it("Should revert because expiry date is not active", async function () {
      const { att, primaryRouter, uidAccount } = await loadFixture(getContractsFixture);
      await expect(
        primaryRouter.connect(uidAccount).sell(att.address, 10, { value: ethers.utils.parseEther("0.0024") })
      ).to.be.reverted;
    });

    // Test if the sell function can be called without any erc20 allowance
    it("Should revert because spender has no allowance", async function () {
      const { att, primaryRouter, tokenData, uidAccount } = await loadFixture(getContractsFixture);
      await primaryRouter.add(
        tokenData.outputTokenAddress,
        tokenData.issuer,
        tokenData.issuancePrice,
        tokenData.expiryPrice,
        tokenData.issuanceTokenAddress
      );
      await expect(primaryRouter.connect(uidAccount).sell(att.address, 1, { value: ethers.utils.parseEther("0.0024") }))
        .to.be.reverted;
    });

    // Test if the sell function transfers the tokens to the issuer & emits a 'SuccessfulExpiration' Event
    it("Transfer Token to issuer", async function () {
      const { att, primaryRouter, tokenData, uidAccount } = await loadFixture(getContractsFixture);
      await primaryRouter.add(
        tokenData.outputTokenAddress,
        tokenData.issuer,
        tokenData.issuancePrice,
        tokenData.expiryPrice,
        tokenData.issuanceTokenAddress
      );
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI);
      await usdcContract.connect(uidAccount).approve(primaryRouter.address, 100000000);
      await primaryRouter.connect(uidAccount).buy(att.address, 1, { value: ethers.utils.parseEther("0.0024") });
      await att.setBondExpiry();
      await primaryRouter.connect(uidAccount).sell(att.address, 1, { value: ethers.utils.parseEther("0.0024") });
      await expect(primaryRouter.connect(uidAccount).sell(att.address, 1, { value: ethers.utils.parseEther("0.0024") }))
        .to.emit(primaryRouter, "SuccessfulExpiration")
        .withArgs(uidAccount.address, tokenData.outputTokenAddress, 1);
    });
  });

  describe("Change Router Gater Address", function () {
    // Test if the update router gater function can be called by non-admins
    it("Should revert because caller is not router admin", async function () {
      const { addr1, primaryRouter, routerGater } = await loadFixture(getContractsFixture);
      await expect(primaryRouter.connect(addr1).updateRouterGaterAddress(routerGater.address)).to.be.reverted;
    });

    // Test if the update router gater function can be called by admins
    it("Should revert because caller is not router admin", async function () {
      const { primaryRouter, routerGater } = await loadFixture(getContractsFixture);
      expect(await primaryRouter.routerGater()).to.equalIgnoreCase(routerGater.address);
      await primaryRouter.updateRouterGaterAddress(USDC_ADDRESS);
      expect(await primaryRouter.routerGater()).to.equalIgnoreCase(USDC_ADDRESS);
    });
  });
});
