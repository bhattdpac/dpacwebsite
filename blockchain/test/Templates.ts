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

    // Deploy ConfidentialityNDA
    const termDuration = 31536000; // 1 year
    const ConfidentialityNDA = await ethers.getContractFactory("ConfidentialityNDA");
    const nda = await ConfidentialityNDA.deploy(docHash, docURI, payer.address, payee.address, termDuration);

    // Deploy SecuredLoan
    const loanAmount = ethers.parseEther("5.0");
    const interestRate = 500; // 5%
    const currentBlock = await ethers.provider.getBlock("latest");
    const deadline = currentBlock!.timestamp + 3600; // 1 hour from now
    const SecuredLoan = await ethers.getContractFactory("SecuredLoan");
    const loan = await SecuredLoan.deploy(docHash, docURI, payer.address, payee.address, loanAmount, interestRate, deadline);

    return { base, escrow, termination, nda, loan, owner, payer, payee, docHash, docURI, totalAmount, loanAmount, interestRate, deadline };
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

  describe("ConfidentialityNDA", function () {
    it("Should set correct parties and term duration", async function () {
      const { nda, payer, payee } = await loadFixture(deployTemplatesFixture);
      expect(await nda.disclosingParty()).to.equal(payer.address);
      expect(await nda.receivingParty()).to.equal(payee.address);
    });

    it("Should not be active if not finalized", async function () {
      const { nda } = await loadFixture(deployTemplatesFixture);
      expect(await nda.isActive()).to.be.false;
    });

    it("Should be active after finalization", async function () {
      const { nda } = await loadFixture(deployTemplatesFixture);
      await nda.finalize();
      expect(await nda.isActive()).to.be.true;
    });
  });

  describe("SecuredLoan", function () {
    it("Should set correct loan parameters", async function () {
      const { loan, payer, payee, loanAmount, interestRate } = await loadFixture(deployTemplatesFixture);
      expect(await loan.lender()).to.equal(payer.address);
      expect(await loan.borrower()).to.equal(payee.address);
      expect(await loan.loanAmount()).to.equal(loanAmount);
      expect(await loan.interestRate()).to.equal(interestRate);
    });

    it("Should allow lender to fund the loan", async function () {
      const { loan, payer, payee, loanAmount } = await loadFixture(deployTemplatesFixture);
      const initialBorrowerBalance = await ethers.provider.getBalance(payee.address);
      
      await loan.connect(payer).fundLoan({ value: loanAmount });
      
      expect(await loan.state()).to.equal(1); // State.Active
      expect(await ethers.provider.getBalance(payee.address)).to.equal(initialBorrowerBalance + loanAmount);
    });

    it("Should allow borrower to repay the loan with interest", async function () {
      const { loan, payer, payee, loanAmount, interestRate } = await loadFixture(deployTemplatesFixture);
      await loan.connect(payer).fundLoan({ value: loanAmount });
      
      const totalRepayment = loanAmount + (loanAmount * BigInt(interestRate) / 10000n);
      const initialLenderBalance = await ethers.provider.getBalance(payer.address);
      
      await loan.connect(payee).repayLoan({ value: totalRepayment });
      
      expect(await loan.state()).to.equal(2); // State.Repaid
      expect(await ethers.provider.getBalance(payer.address)).to.equal(initialLenderBalance + totalRepayment);
    });
  });
});
