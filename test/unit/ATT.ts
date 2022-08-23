import { smock } from '@defi-wonderland/smock';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chai, { expect } from "chai";
import { ethers } from "hardhat";

chai.use(smock.matchers);

describe("ATT", function () {
  async function getContracts() {
    const [owner, addr1] = await ethers.getSigners();
    const MULTISIG = addr1.address;

    const ATT = await ethers.getContractFactory("ATT");
    const PRIMARY_ROUTER = await ethers.getContractFactory("primaryRouter");
    const primaryRouter = await PRIMARY_ROUTER.deploy(MULTISIG);

    console.log("deployed router: ", primaryRouter.address);

    const att = await ATT.deploy(MULTISIG, primaryRouter.address);
    const myContractFake =  await smock.fake(att);
    return { att, primaryRouter, owner, addr1, myContractFake };
  }

    describe("Check primary market", function () {
      it("Check if primary market is active", async function () {
        const { att } = await getContracts();
        expect(await att.isPrimaryMarketActive()).to.equal(true);
      });

      it("Should return false when totalSupply = cap", async function () {
        const { myContractFake } = await getContracts();
        myContractFake.totalSupply.returns(10)
        myContractFake.cap.returns(10)
        expect(await myContractFake.isPrimaryMarketActive()).to.equal(false);
      });

      it("Should return false when totalSupply > cap", async function () {
        const { myContractFake } = await getContracts();
        myContractFake.totalSupply.returns(10)
        myContractFake.cap.returns(5)
        expect(await myContractFake.isPrimaryMarketActive()).to.equal(false);
      });
    });

    it("Check if bond has expired", async function () {
      const { att } = await loadFixture(getContracts);
      expect(await att.seeBondExpiryStatus()).to.equal(false);
    });

    it("Should revert because caller is not the admin", async function () {
      const { att } = await loadFixture(getContracts);
      await expect(att.setBondExpiry()).to.be.reverted;
    });

    it("Should set bond expiry to true", async function () {
      const { att, addr1 } = await loadFixture(getContracts);
      expect(await att.connect(addr1).setBondExpiry());
      expect(await att.seeBondExpiryStatus()).to.equal(true)
    });
});