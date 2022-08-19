import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from 'ethereum-waffle';

describe("ATT", function () {
  async function getContracts() {
    const MULTISIG = "0xBA072c1018cec4a1A8A6abF2971a37549e3B5aCF";

    const ATT = await ethers.getContractFactory("ATT");
    const PRIMARY_ROUTER = await ethers.getContractFactory("primaryRouter");
    const primaryRouter = await PRIMARY_ROUTER.deploy(MULTISIG);

    console.log("deployed router: ", primaryRouter.address);

    const att = await ATT.deploy(MULTISIG, primaryRouter.address);
    return { att, primaryRouter };
  }

    it("Check if primary market is active", async function () {
      const { att } = await loadFixture(getContracts);
      expect(await att.isPrimaryMarketActive()).to.equal(true);
    });

    it("Check if bond has expired", async function () {
      const { att } = await loadFixture(getContracts);
      expect(await att.seeBondExpiryStatus()).to.equal(false);
    });

    it("Should revert because caller is not the admin", async function () {
      const { att } = await loadFixture(getContracts);
      const [owner] = await ethers.getSigners();

      await expect(att.setBondExpiry()).to.be.revertedWith(`AccessControl: account ${owner.address} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`);
    });
});