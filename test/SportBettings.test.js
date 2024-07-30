const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SportBettings", function () {
  let FeeProxy, SportBettings, feeProxy, sportBettings, owner, addr1, addr2;

  beforeEach(async function () {
    FeeProxy = await ethers.getContractFactory("FeeProxy");
    SportBettings = await ethers.getContractFactory("SportBettings");

    [owner, addr1, addr2, _] = await ethers.getSigners();

    // Deploy FeeProxy
    feeProxy = await FeeProxy.deploy();
    await feeProxy.deployed();

    // Deploy SportBettings with FeeProxy address
    sportBettings = await SportBettings.deploy(feeProxy.address);
    await sportBettings.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await sportBettings.admin()).to.equal(owner.address);
    });

    it("Should set the correct FeeProxy address", async function () {
      expect(await sportBettings.feeProxy()).to.equal(feeProxy.address);
    });
  });

  describe("Create Match", function () {
    it("Should create a match", async function () {
      await sportBettings.createMatch("TeamA", "TeamB");
      const matchId = await sportBettings.matchTeamId("TeamA", "TeamB");
      expect(matchId).to.be.gt(0);
    });

    it("Should not allow duplicate match creation", async function () {
      await sportBettings.createMatch("TeamA", "TeamB");
      await expect(sportBettings.createMatch("TeamA", "TeamB")).to.be.revertedWith("MATCH TEAM ALREADY CREATED");
    });
  });

  describe("Open Match", function () {
    it("Should open a match", async function () {
      await sportBettings.createMatch("TeamA", "TeamB");
      const matchId = await sportBettings.matchTeamId("TeamA", "TeamB");
      await sportBettings.openMatch("TeamA", "TeamB");
      const match = await sportBettings.matches(matchId);
      expect(match.teamA).to.equal("TeamA");
      expect(match.teamB).to.equal("TeamB");
      expect(match.isSettled).to.equal(false);
    });
  });

  describe("Place Bet", function () {
    it("Should place a bet", async function () {
      await sportBettings.createMatch("TeamA", "TeamB");
      const matchId = await sportBettings.matchTeamId("TeamA", "TeamB");
      await sportBettings.openMatch("TeamA", "TeamB");

      await sportBettings.connect(addr1).placeBet(matchId, 1, { value: ethers.utils.parseEther("1.0") });

      const bet = await sportBettings.userBets(addr1.address, matchId);
      expect(bet.amount).to.equal(ethers.utils.parseEther("1.0"));
      expect(bet.favoriteTeam).to.equal(1);
    });
  });

  describe("Settle Match", function () {
    it("Should settle a match and calculate commission", async function () {
      await feeProxy.setFeePercent(5); // Set fee percent to 5%
      await sportBettings.createMatch("TeamA", "TeamB");
      const matchId = await sportBettings.matchTeamId("TeamA", "TeamB");
      await sportBettings.openMatch("TeamA", "TeamB");

      await sportBettings.connect(addr1).placeBet(matchId, 1, { value: ethers.utils.parseEther("1.0") });
      await sportBettings.connect(addr2).placeBet(matchId, 2, { value: ethers.utils.parseEther("2.0") });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await sportBettings.settleMatch(matchId, 1);
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance.sub(initialBalance)).to.be.above(ethers.utils.parseEther("0.14")); // Amount should be 5% of 3, approximately 0.15 ETH
    });
  });

  describe("Withdraw Winnings", function () {
    it("Should withdraw winnings", async function () {
      await feeProxy.setFeePercent(5); // Set fee percent to 5%
      await sportBettings.createMatch("TeamA", "TeamB");
      const matchId = await sportBettings.matchTeamId("TeamA", "TeamB");
      await sportBettings.openMatch("TeamA", "TeamB");

      await sportBettings.connect(addr1).placeBet(matchId, 1, { value: ethers.utils.parseEther("1.0") });
      await sportBettings.connect(addr2).placeBet(matchId, 2, { value: ethers.utils.parseEther("2.0") });

      await sportBettings.settleMatch(matchId, 1);

      const initialBalance = await ethers.provider.getBalance(addr1.address);
      await sportBettings.connect(addr1).withdrawWinnings(matchId);
      const finalBalance = await ethers.provider.getBalance(addr1.address);

      expect(finalBalance.sub(initialBalance)).to.be.above(ethers.utils.parseEther("2.84")); // Amount should be 95% of 3, approximately 3-0.15 = 2.85  ETH
    });
  });

  describe("Contract Balance", function () {
    it("Should return contract balance", async function () {
      await sportBettings.createMatch("TeamA", "TeamB");
      const matchId = await sportBettings.matchTeamId("TeamA", "TeamB");
      await sportBettings.openMatch("TeamA", "TeamB");

      await sportBettings.connect(addr1).placeBet(matchId, 1, { value: ethers.utils.parseEther("1.0") });
      const balance = await sportBettings.getContractBalance();
      expect(balance).to.equal(ethers.utils.parseEther("1.0"));
    });
  });
});