const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AureaCert", function () {
  let contract;
  let issuer, buyer, other;

  const PRODUCT_ID = "prod-001";
  const PRODUCT_NAME = "Chaqueta de cuero";
  const SERIAL = "SN-ABC-12345";
  const METADATA_URI = "ipfs://QmTestHash";

  beforeEach(async function () {
    [issuer, buyer, other] = await ethers.getSigners();
    const AureaCert = await ethers.getContractFactory("AureaCert");
    contract = await AureaCert.deploy(issuer.address);
  });

  describe("Despliegue", function () {
    it("fija el issuer correcto", async function () {
      expect(await contract.issuer()).to.equal(issuer.address);
    });
    it("empieza con 0 certificados", async function () {
      expect(await contract.totalCertificates()).to.equal(0);
    });
    it("revierte si el issuer es la dirección cero", async function () {
      const AureaCert = await ethers.getContractFactory("AureaCert");
      await expect(AureaCert.deploy(ethers.ZeroAddress)).to.be.revertedWith("AureaCert: issuer cannot be zero");
    });
  });

  describe("issueCertificate", function () {
    it("emite un certificado correctamente", async function () {
      await contract.connect(issuer).issueCertificate(PRODUCT_ID, PRODUCT_NAME, SERIAL, buyer.address, METADATA_URI);
      const cert = await contract.getCertificate(1);
      expect(cert.productId).to.equal(PRODUCT_ID);
      expect(cert.serialNumber).to.equal(SERIAL);
      expect(cert.owner).to.equal(buyer.address);
      expect(cert.exists).to.be.true;
    });
    it("incrementa totalCertificates", async function () {
      await contract.connect(issuer).issueCertificate(PRODUCT_ID, PRODUCT_NAME, SERIAL, buyer.address, METADATA_URI);
      expect(await contract.totalCertificates()).to.equal(1);
    });
    it("revierte si lo llama alguien que no es el issuer", async function () {
      await expect(contract.connect(other).issueCertificate(PRODUCT_ID, PRODUCT_NAME, SERIAL, buyer.address, METADATA_URI)).to.be.revertedWith("AureaCert: caller is not the issuer");
    });
    it("revierte si el serial ya existe", async function () {
      await contract.connect(issuer).issueCertificate(PRODUCT_ID, PRODUCT_NAME, SERIAL, buyer.address, METADATA_URI);
      await expect(contract.connect(issuer).issueCertificate("prod-002", "Otra", SERIAL, buyer.address, "")).to.be.revertedWith("AureaCert: serial already issued");
    });
    it("revierte si el productId está vacío", async function () {
      await expect(contract.connect(issuer).issueCertificate("", PRODUCT_NAME, SERIAL, buyer.address, METADATA_URI)).to.be.revertedWith("AureaCert: productId required");
    });
    it("revierte si el owner es la dirección cero", async function () {
      await expect(contract.connect(issuer).issueCertificate(PRODUCT_ID, PRODUCT_NAME, SERIAL, ethers.ZeroAddress, METADATA_URI)).to.be.revertedWith("AureaCert: owner cannot be zero");
    });
  });

  describe("getCertificateBySerial", function () {
    it("devuelve el certificado por serial", async function () {
      await contract.connect(issuer).issueCertificate(PRODUCT_ID, PRODUCT_NAME, SERIAL, buyer.address, METADATA_URI);
      const cert = await contract.getCertificateBySerial(SERIAL);
      expect(cert.id).to.equal(1);
    });
    it("revierte si el serial no existe", async function () {
      await expect(contract.getCertificateBySerial("SN-NOPE")).to.be.revertedWith("AureaCert: serial not found");
    });
  });

  describe("isCertified", function () {
    it("devuelve true si existe", async function () {
      await contract.connect(issuer).issueCertificate(PRODUCT_ID, PRODUCT_NAME, SERIAL, buyer.address, METADATA_URI);
      expect(await contract.isCertified(SERIAL)).to.be.true;
    });
    it("devuelve false si no existe", async function () {
      expect(await contract.isCertified("SN-NOPE")).to.be.false;
    });
  });

  describe("transferIssuer", function () {
    it("transfiere el rol correctamente", async function () {
      await contract.connect(issuer).transferIssuer(other.address);
      expect(await contract.issuer()).to.equal(other.address);
    });
    it("revierte si lo llama alguien que no es el issuer", async function () {
      await expect(contract.connect(other).transferIssuer(other.address)).to.be.revertedWith("AureaCert: caller is not the issuer");
    });
    it("el issuer anterior ya no puede emitir", async function () {
      await contract.connect(issuer).transferIssuer(other.address);
      await expect(contract.connect(issuer).issueCertificate(PRODUCT_ID, PRODUCT_NAME, SERIAL, buyer.address, METADATA_URI)).to.be.revertedWith("AureaCert: caller is not the issuer");
    });
  });
});
