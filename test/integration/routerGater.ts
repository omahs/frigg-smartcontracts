import { smock } from "@defi-wonderland/smock";
import chai, { expect } from "chai";
import { ethers } from "hardhat";
import {
  GOLDFINCH_UID,
  GOLDFINCH_UID_TESTNET,
  QUADRATA_INVALID_AML,
  QUADRATA_INVALID_COUNTRY,
  QUADRATA_UID,
  QUADRATA_UID_TESTNET,
} from "./constants";

chai.use(smock.matchers);

// Unit Tests for routerGater.sol
describe("routerGater", function () {
  /*
    Method that runs before each test, gets "chached" with loadFixture(getContractsFixture)
    Basic Setup of our smartcontractc routerGater
  */
  async function getContractsFixture() {
    const [owner, addr1] = await ethers.getSigners();

    const ROUTER_GATER = await ethers.getContractFactory("routerGater");

    const VALID_UID_HOLDERS = [
      "0x8745be2c582bcfc50acf9d2c61caded65a4e3825",
      "0xc7470e71627ea66bbfbfd275a616b07273295493",
    ];

    const INVALID_UID_HOLDERS = [
      "0x93f7af2f3Fe6695f8dA42a4282B0c96F316CbF28",
      "0x8F36F1F707539127d939867347B3a63Aee4dfCb0",
      "0x91e795eB6a2307eDe1A0eeDe84e6F0914f60a9C3",
    ];

    const routerGater = await ROUTER_GATER.deploy(owner.address, GOLDFINCH_UID_TESTNET, QUADRATA_UID_TESTNET);

    const myContractFake = await smock.fake(routerGater);

    return {
      routerGater,
      owner,
      addr1,
      myContractFake,
      VALID_UID_HOLDERS,
      INVALID_UID_HOLDERS,
    };
  }

  describe("Update UID Contract Addresses", function () {
    it("Should revert, cause the caller is no admin", async function () {
      const { routerGater, addr1 } = await getContractsFixture();
      await expect(routerGater.connect(addr1).updateGoldfinchUIDAddress(GOLDFINCH_UID_TESTNET)).to.be.reverted;
    });

    it("Should update the goldfinch uid contract address", async function () {
      const { routerGater } = await getContractsFixture();
      expect(await routerGater.goldfinchUIDAddress()).to.equalIgnoreCase(GOLDFINCH_UID_TESTNET);
      await routerGater.updateGoldfinchUIDAddress(GOLDFINCH_UID);
      expect(await routerGater.goldfinchUIDAddress()).to.equalIgnoreCase(GOLDFINCH_UID);
    });

    it("Should revert, cause the caller is no admin", async function () {
      const { routerGater, addr1 } = await getContractsFixture();
      await expect(routerGater.connect(addr1).updateQuadrataAddress(QUADRATA_UID)).to.be.reverted;
    });

    it("Should update the quadrata uid contract address", async function () {
      const { routerGater } = await getContractsFixture();
      expect(await routerGater.quadrataAddress()).to.equalIgnoreCase(QUADRATA_UID_TESTNET);
      await routerGater.updateQuadrataAddress(QUADRATA_UID);
      expect(await routerGater.quadrataAddress()).to.equalIgnoreCase(QUADRATA_UID);
    });
  });

  describe("Update accepted Goldfinchids", function () {
    it("Should revert, cause the caller is no admin", async function () {
      const { routerGater, addr1 } = await getContractsFixture();
      await expect(routerGater.connect(addr1).updateAcceptedIds(0, false)).to.be.reverted;
    });

    it("Should change Id '0' = invalid, Id '1' = valid", async function () {
      const { routerGater } = await getContractsFixture();
      await routerGater.updateAcceptedIds(0, false);
      await routerGater.updateAcceptedIds(1, true);

      expect(await routerGater.acceptedGoldfinchIds(0)).to.equal(false);
      expect(await routerGater.acceptedGoldfinchIds(1)).to.equal(true);
    });
  });

  describe("Update Quadrata banned countries", function () {
    const country = ethers.utils.formatBytes32String("DE");

    it("Should revert, cause the caller is no admin", async function () {
      const { routerGater, addr1 } = await getContractsFixture();
      await expect(routerGater.connect(addr1).updateQuadrataBlockedCountries(country)).to.be.reverted;
    });

    it("Should change blocking list of quadrata", async function () {
      const { routerGater } = await getContractsFixture();
      await routerGater.updateQuadrataBlockedCountries(country);

      expect(await routerGater.quadrataBlockedCountries(country)).to.equal(true);
    });
  });

  describe("Test goldfinch logic", function () {
    it("Should return false, because no uid token is in the wallet", async function () {
      const { routerGater, addr1 } = await getContractsFixture();
      expect(await routerGater.goldfinchLogic(addr1.address)).to.equal(false);
    });

    it("Should return false, because no uid token is valid", async function () {
      const { routerGater, INVALID_UID_HOLDERS } = await getContractsFixture();

      expect(await routerGater.goldfinchLogic(INVALID_UID_HOLDERS[0])).to.equal(false);
      expect(await routerGater.goldfinchLogic(INVALID_UID_HOLDERS[1])).to.equal(false);
      expect(await routerGater.goldfinchLogic(INVALID_UID_HOLDERS[2])).to.equal(false);
    });

    it("Should return true, because uid token is valid", async function () {
      const { routerGater, VALID_UID_HOLDERS: VALID_UID_HOLDERS_ADDRESSES } = await getContractsFixture();

      expect(await routerGater.goldfinchLogic(VALID_UID_HOLDERS_ADDRESSES[0])).to.equal(true);
      expect(await routerGater.goldfinchLogic(VALID_UID_HOLDERS_ADDRESSES[1])).to.equal(true);
    });
  });

  describe("Test quadrata logic", function () {
    it("Should revert, because no query fee was provided for quadrata", async function () {
      const { routerGater, addr1 } = await getContractsFixture();
      await expect(routerGater.quadrataLogic(addr1.address)).to.be.revertedWith("MISSING QUERY FEE");
    });

    it("Should revert, because account has to high risk AML", async function () {
      const { routerGater } = await getContractsFixture();
      await expect(
        routerGater.quadrataLogic(QUADRATA_INVALID_AML, { value: ethers.utils.parseEther("0.0024") })
      ).to.be.revertedWith("High risk AML");
    });

    it("Should revert, because account has to high risk AML", async function () {
      const { routerGater } = await getContractsFixture();
      await expect(
        routerGater.quadrataLogic(QUADRATA_INVALID_COUNTRY, { value: ethers.utils.parseEther("0.0024") })
      ).to.be.revertedWith("BANNED_COUNTRY");
    });
  });

  describe("Check gated status", function () {
    describe("Goldfinch", function () {
      it("Should return true, because goldfinch uid is valid", async function () {
        const { routerGater, VALID_UID_HOLDERS } = await getContractsFixture();
        await expect(routerGater.checkGatedStatus(VALID_UID_HOLDERS[0], { value: ethers.utils.parseEther("0.0024") }))
          .to.not.reverted;
      });
    });

    describe("Quadrata", function () {
      it("Should return false, because quadrata passport is not valid", async function () {
        const { routerGater } = await getContractsFixture();
        await expect(routerGater.checkGatedStatus(QUADRATA_INVALID_AML, { value: ethers.utils.parseEther("0.0024") }))
          .to.be.reverted;
      });

      it("Should return true, because quadrata passport is valid", async function () {
        const { routerGater, addr1 } = await getContractsFixture();
        await expect(routerGater.checkGatedStatus(addr1.address, { value: ethers.utils.parseEther("0.0024") })).to.not
          .reverted;
      });
    });
  });
});
