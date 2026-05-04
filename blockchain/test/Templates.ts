import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Legal Contract Templates", function () {
  async function deployTemplatesFixture() {
    const [owner, payer, payee] = await ethers.getSigners();
    
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("Legal Document Content"));
    const docURI = "https://example.com/doc.pdf";

    // Deploy Base
    const BaseLegalContract = await ethers.getContractFactory("BaseLegalContract");
    const base = await BaseLegalContract.deploy(docHash, docURI);

    // Deploy PaymentEscrow
    const totalAmount = ethers.parseEther("1.0");
    const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
    const escrow = await PaymentEscrow.deploy(docHash, docURI, payer.address, payee.address, totalAmount);

    // Deploy TerminationLogic
    const TerminationLogic = await ethers.getContractFactory("TerminationLogic");
    const termination = await TerminationLogic.deploy(docHash, docURI, 30); // 30 days

    return { base, escrow, termination, owner, payer, payee, docHash, docURI, totalAmount };
  }

  describe("BaseLegalContract", function () {
    it("Should store the correct document hash and URI", async function () {
      const { base, docHash, docURI } = await loadFixture(deployTemplatesFixture);
      expect(await base.documentHash()).to.equal(docHash);
      expect(await base.documentURI()).to.equal(docURI);
    });

    it("Should allow owner to finalize", async function () {
      const { base } = await loadFixture(deployTemplatesFixture);
      await base.finalize();
      expect(await base.isFinalized()).to.be.true;
    });
  });

  describe("PaymentEscrow", function () {
    it("Should allow payer to fund", async function () {
      const { escrow, payer, totalAmount } = await loadFixture(deployTemplatesFixture);
      await escrow.connect(payer).fund({ value: totalAmount });
      expect(await escrow.state()).to.equal(1); // State.Funded
    });

    it("Should allow owner to release after finalization", async function () {
      const { escrow, payer, payee, totalAmount } = await loadFixture(deployTemplatesFixture);
      await escrow.connect(payer).fund({ value: totalAmount });
      await escrow.finalize();
      
      const initialBalance = await ethers.provider.getBalance(payee.address);
      await escrow.release();
      
      expect(await escrow.state()).to.equal(2); // State.Released
      expect(await ethers.provider.getBalance(payee.address)).to.equal(initialBalance + totalAmount);
    });

    it("Should prevent release if not finalized", async function () {
      const { escrow, payer, totalAmount } = await loadFixture(deployTemplatesFixture);
      await escrow.connect(payer).fund({ value: totalAmount });
      await expect(escrow.release()).to.be.revertedWith("Contract must be finalized first");
    });
  });

  describe("TerminationLogic", function () {
    it("Should be valid initially", async function () {
      const { termination } = await loadFixture(deployTemplatesFixture);
      expect(await termination.isValid()).to.be.true;
    });

    it("Should become invalid after manual termination", async function () {
      const { termination } = await loadFixture(deployTemplatesFixture);
      await termination.terminate();
      expect(await termination.isValid()).to.be.false;
      expect(await termination.isTerminated()).to.be.true;
    });
  });
});
