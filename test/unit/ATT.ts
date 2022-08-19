import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from 'ethereum-waffle';

describe("ATT", function () {
  async function getContracts() {
    const [owner, addr1] = await ethers.getSigners();
    const MULTISIG = addr1.address;

    const ATT = await ethers.getContractFactory("ATT");
    const PRIMARY_ROUTER = await ethers.getContractFactory("primaryRouter");
    const primaryRouter = await PRIMARY_ROUTER.deploy(MULTISIG);

    console.log("deployed router: ", primaryRouter.address);

    const att = await ATT.deploy(MULTISIG, primaryRouter.address);
    return { att, primaryRouter, owner, addr1 };
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
      const { att, owner } = await loadFixture(getContracts);

      expect(await att.setBondExpiry()).to.be.revertedWith(`AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`);
    });

    it("Should set bond expiry to true", async function () {
      const { att, addr1 } = await loadFixture(getContracts);

      expect(await att.connect(addr1).setBondExpiry());
      expect(await att.seeBondExpiryStatus()).to.equal(true)
    });
});