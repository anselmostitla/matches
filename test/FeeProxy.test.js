const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FeeProxy", function () {
  let FeeProxy, feeProxy, owner, addr1;

  beforeEach(async function () {
    FeeProxy = await ethers.getContractFactory("FeeProxy");
    [owner, addr1, _] = await ethers.getSigners();
    feeProxy = await FeeProxy.deploy();
    await feeProxy.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await feeProxy.admin()).to.equal(owner.address);
    });

    it("Should set initial feePercent to 3", async function () {
      expect(await feeProxy.getFeePercent()).to.equal(3);
    });
  });

  describe("setFeePercent", function () {
    it("Should update the fee percent", async function () {
      await feeProxy.setFeePercent(5);
      expect(await feeProxy.getFeePercent()).to.equal(5);
    });

    it("Should not allow fee percent greater than 100", async function () {
      await expect(feeProxy.setFeePercent(101)).to.be.revertedWith("FEE PERCENT CANNOT EXCEED 100");
    });

    it("Should only allow admin to set fee percent", async function () {
      await expect(feeProxy.connect(addr1).setFeePercent(10)).to.be.revertedWith("NOT ADMIN");
    });
  });
});