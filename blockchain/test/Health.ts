import { expect } from "chai";
import hre from "hardhat";

describe("Health", function () {
  it("Should return 'Healthy' status", async function () {
    const Health = await hre.ethers.getContractFactory("Health");
    const health = await Health.deploy();
    expect(await health.getStatus()).to.equal("Healthy");
  });
});
