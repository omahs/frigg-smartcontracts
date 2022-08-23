import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

// Integration Tests for ATT.sol
describe("ATT", function () {
  /*
    Method that runs before each test, gets "chached" with loadFixture(getContractsFixture)
    Basic Setup of our smartcontracts (ATT.sol & primaryRouter.sol)
  */
  async function getContractsFixture() {
    const [owner, addr1] = await ethers.getSigners();
    const MULTISIG = owner.address;

    const ATT = await ethers.getContractFactory("ATT", owner);
    const PRIMARY_ROUTER = await ethers.getContractFactory("primaryRouter", owner);
    const primaryRouter = await PRIMARY_ROUTER.deploy(MULTISIG);

    // Owner Address is set as Default Admin on Router
    const att = await ATT.deploy(MULTISIG, owner.address);
    return { att, primaryRouter, owner, addr1 };
  }

  // Testing the behaviour of ATT's mint & burn functions
  describe("Mint & Burn Tokens", function () {
    const attAmount = 10;

    // Test if a new token has been minted
    it("Mint new ATT Token", async function () {
      const { att, owner, addr1 } = await loadFixture(getContractsFixture);

      await att.mint(owner.address, attAmount);

      await expect(att.connect(addr1).mint(owner.address, attAmount)).to.be.reverted;

      const attBalance = await att.balanceOf(owner.address);
      expect(attBalance).to.be.equal(attAmount);
    });

    // Test if a newly minted token is burned
    it("Burn ATT Token", async function () {
      const { att, owner } = await loadFixture(getContractsFixture);

      await att.mint(owner.address, attAmount);

      let attBalance = await att.balanceOf(owner.address);
      expect(attBalance).to.be.equal(attAmount);

      await att.burn(owner.address, attAmount);
      attBalance = await att.balanceOf(owner.address);
      expect(attBalance).to.be.not.equal(attAmount);
    });
  });
});