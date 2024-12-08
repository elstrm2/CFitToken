const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CFITTOKEN", function () {
  let CFITTOKEN, cfiToken, owner, addr1, addr2;

  const initialSupply = ethers.parseUnits("2000", 18);

  beforeEach(async function () {
    CFITTOKEN = await ethers.getContractFactory("CFITTOKEN");
    [owner, addr1, addr2] = await ethers.getSigners();
    cfiToken = await CFITTOKEN.deploy(initialSupply);
    await cfiToken.waitForDeployment();

    const reserve = ethers.parseUnits("1000", 18);
    await cfiToken.transfer(await cfiToken.getAddress(), reserve);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const contractOwner = await cfiToken.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await cfiToken.balanceOf(owner.address);
      const expectedSupply = ethers.parseUnits("1000", 18);
      expect(ownerBalance).to.equal(expectedSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await cfiToken.transfer(addr1.address, ethers.parseUnits("50", 18));
      expect(await cfiToken.balanceOf(addr1.address)).to.equal(ethers.parseUnits("50", 18));

      await cfiToken.connect(addr1).transfer(addr2.address, ethers.parseUnits("50", 18));
      expect(await cfiToken.balanceOf(addr2.address)).to.equal(ethers.parseUnits("50", 18));
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await cfiToken.balanceOf(owner.address);

      await expect(cfiToken.connect(addr1).transfer(owner.address, ethers.parseUnits("1", 18))).to.be.revertedWith(
        "ERC20: transfer amount exceeds balance"
      );

      expect(await cfiToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      await cfiToken.transfer(addr1.address, ethers.parseUnits("100", 18));

      await cfiToken.connect(addr1).stake(ethers.parseUnits("50", 18), 30 * 24 * 60 * 60);

      const stakeCount = await cfiToken.getStakeCount(addr1.address);
      expect(stakeCount).to.equal(1);

      const stake = await cfiToken.getStake(addr1.address, 0);
      expect(stake.amount).to.equal(ethers.parseUnits("50", 18));
      expect(stake.lockDuration).to.equal(30 * 24 * 60 * 60);
    });

    it("Should calculate rewards correctly upon withdrawal", async function () {
      await cfiToken.transfer(addr1.address, ethers.parseUnits("100", 18));

      await cfiToken.connect(addr1).stake(ethers.parseUnits("50", 18), 365 * 24 * 60 * 60);

      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const initialBalance = await cfiToken.balanceOf(addr1.address);

      await cfiToken.connect(addr1).withdrawStake(0);

      const finalBalance = await cfiToken.balanceOf(addr1.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseUnits("55", 18));
    });

    it("Should not allow withdrawal before lock duration", async function () {
      await cfiToken.transfer(addr1.address, ethers.parseUnits("100", 18));

      await cfiToken.connect(addr1).stake(ethers.parseUnits("50", 18), 30 * 24 * 60 * 60);

      await expect(cfiToken.connect(addr1).withdrawStake(0)).to.be.revertedWith("Stake is still locked");
    });

    it("Should handle multiple stakes correctly", async function () {
      await cfiToken.transfer(addr1.address, ethers.parseUnits("200", 18));

      await cfiToken.connect(addr1).stake(ethers.parseUnits("50", 18), 30 * 24 * 60 * 60);

      await cfiToken.connect(addr1).stake(ethers.parseUnits("100", 18), 60 * 24 * 60 * 60);

      const stakeCount = await cfiToken.getStakeCount(addr1.address);
      expect(stakeCount).to.equal(2);
    });

    it("Should handle empty stake array correctly", async function () {
      await expect(cfiToken.connect(addr1).withdrawStake(0)).to.be.revertedWith("Invalid stake index");
    });
  });
});
