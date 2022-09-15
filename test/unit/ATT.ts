import { smock } from "@defi-wonderland/smock";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai, { expect } from "chai";
import { ethers } from "hardhat";
import { GOLDFINCH_UID_TESTNET, QUADRATA_UID_TESTNET } from "../integration/constants";

chai.use(smock.matchers);

// Unit Tests for ATT.sol
describe("ATT", function () {
  /*
    Method that runs before each test, gets "chached" with loadFixture(getContractsFixture)
    Basic Setup of our smartcontracts (ATT.sol & primaryRouter.sol)
  */
  async function getContractsFixture() {
    const [owner, addr1] = await ethers.getSigners();
    const MULTISIG = addr1.address;

    const ATT = await ethers.getContractFactory("ATT");
    const PRIMARY_ROUTER = await ethers.getContractFactory("primaryRouter");
    const ROUTER_GATER = await ethers.getContractFactory("routerGater");

    const routerGater = await ROUTER_GATER.deploy(MULTISIG, GOLDFINCH_UID_TESTNET, QUADRATA_UID_TESTNET);
    const primaryRouter = await PRIMARY_ROUTER.deploy(MULTISIG, routerGater.address);
    const att = await ATT.deploy(MULTISIG, primaryRouter.address);
    const myContractFake = await smock.fake(att);
    return { att, primaryRouter, owner, addr1, myContractFake };
  }

  // Testing the behaviour of the contract function "isPrimaryMarketActive"
  describe("Check primary market", function () {
    // Test if primary market is active, default = true
    it("Check if primary market is active", async function () {
      const { att } = await getContractsFixture();
      expect(await att.isPrimaryMarketActive()).to.equal(true);
    });

    // Test if primaryMarket returns false when supply & cap are identical
    it("Should return false when totalSupply = cap", async function () {
      const { myContractFake } = await getContractsFixture();
      myContractFake.totalSupply.returns(10);
      myContractFake.cap.returns(10);
      expect(await myContractFake.isPrimaryMarketActive()).to.equal(false);
    });

    // Test if primaryMarket returns false when supply is > than cap
    it("Should return false when totalSupply > cap", async function () {
      const { myContractFake } = await getContractsFixture();
      myContractFake.totalSupply.returns(10);
      myContractFake.cap.returns(5);
      expect(await myContractFake.isPrimaryMarketActive()).to.equal(false);
    });
  });

  // Test whether the bond has expired
  it("Check if bond has expired", async function () {
    const { att } = await loadFixture(getContractsFixture);
    expect(await att.seeBondExpiryStatus()).to.equal(false);
  });

  // Test if the admin modifier on "setBondExpiry" works
  it("Should revert because caller is not the admin", async function () {
    const { att } = await loadFixture(getContractsFixture);
    await expect(att.setBondExpiry()).to.be.reverted;
  });

  // Set the bond expiry to true
  it("Should set bond expiry to true", async function () {
    const { att, addr1 } = await loadFixture(getContractsFixture);
    expect(await att.connect(addr1).setBondExpiry());
    expect(await att.seeBondExpiryStatus()).to.equal(true);
  });
});
