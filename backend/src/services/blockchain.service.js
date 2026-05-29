/**
 * BlockchainService - Interfaz con el smart contract AureaCert.
 *
 * Usa ethers.js v6 para conectarse a la red configurada (Sepolia por defecto)
 * y expone métodos que el resto del backend consume sin saber nada de ethers.
 *
 * Variables de entorno necesarias:
 *   BLOCKCHAIN_RPC_URL        — URL del nodo RPC (Infura, Alchemy, localhost…)
 *   BLOCKCHAIN_PRIVATE_KEY    — Clave privada de la wallet emisora (issuer)
 *   AUREACERT_CONTRACT_ADDRESS — Dirección del contrato desplegado
 *   BLOCKCHAIN_NETWORK         — Nombre de red (sepolia | localhost) [opcional]
 */
const { ethers } = require("ethers");
const AUREA_CERT_ABI = require("../blockchain/AureaCert.abi");

class BlockchainService {
  constructor() {
    this._provider = null;
    this._signer = null;
    this._contract = null;
    this._ready = false;
  }

  // ─── Inicialización (lazy) ────────────────────────────────────────────────

  /**
   * Inicializa el provider, signer y contrato.
   * Se llama automáticamente la primera vez que se usa cualquier método.
   */
  async init() {
    if (this._ready) return;

    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    const contractAddress = process.env.AUREACERT_CONTRACT_ADDRESS;

    if (!rpcUrl) throw new Error("BlockchainService: BLOCKCHAIN_RPC_URL no configurado");
    if (!privateKey) throw new Error("BlockchainService: BLOCKCHAIN_PRIVATE_KEY no configurado");
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("BlockchainService: AUREACERT_CONTRACT_ADDRESS no configurado");
    }

    this._provider = new ethers.JsonRpcProvider(rpcUrl);
    this._signer = new ethers.Wallet(privateKey, this._provider);
    this._contract = new ethers.Contract(contractAddress, AUREA_CERT_ABI, this._signer);
    this._contractReadOnly = new ethers.Contract(contractAddress, AUREA_CERT_ABI, this._provider);

    this._ready = true;
    console.log("[Blockchain] Servicio iniciado. Contrato:", contractAddress);
  }

  async _ensureReady() {
    if (!this._ready) await this.init();
  }

  // ─── Escritura ────────────────────────────────────────────────────────────

  /**
   * Emite un certificado on-chain llamando a AureaCert.issueCertificate.
   *
   * @param {object} params
   * @param {string} params.productId        ID del producto en MongoDB
   * @param {string} params.productName      Nombre del producto
   * @param {string} params.serialNumber     Número de serie único (ej. AUREA-2026-xxxx)
   * @param {string} params.ownerAddress     Dirección Ethereum del comprador (o hash)
   * @param {string} [params.metadataURI]    URI IPFS con metadatos extendidos
   * @returns {{ txHash, blockNumber, certId, issuedAt, gasUsed, gasPriceWei }}
   */
  async issueCertificate({ productId, productName, serialNumber, ownerAddress, metadataURI = "" }) {
    await this._ensureReady();

    const tx = await this._contract.issueCertificate(
      productId,
      productName,
      serialNumber,
      ownerAddress,
      metadataURI
    );

    const receipt = await tx.wait();

    // Parsear el evento CertificateIssued para obtener el id
    const event = receipt.logs
      .map((log) => {
        try {
          return this._contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "CertificateIssued");

    const certId = event ? Number(event.args.id) : null;
    const issuedAt = event ? new Date(Number(event.args.issuedAt) * 1000) : new Date();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      certId,
      issuedAt,
      gasUsed: Number(receipt.gasUsed),
      gasPriceWei: receipt.gasPrice ? receipt.gasPrice.toString() : null,
      issuerAddress: await this._signer.getAddress(),
      contractAddress: await this._contract.getAddress(),
      network: process.env.BLOCKCHAIN_NETWORK || "sepolia",
    };
  }

  // ─── Lectura ──────────────────────────────────────────────────────────────

  /**
   * Obtiene un certificado por su id numérico.
   * @param {number} id
   */
  async getCertificate(id) {
    await this._ensureReady();
    const cert = await this._contractReadOnly.getCertificate(id);
    return this._formatCert(cert);
  }

  /**
   * Obtiene un certificado por su número de serie.
   * @param {string} serialNumber
   */
  async getCertificateBySerial(serialNumber) {
    await this._ensureReady();
    const cert = await this._contractReadOnly.getCertificateBySerial(serialNumber);
    return this._formatCert(cert);
  }

  /**
   * Comprueba si un número de serie tiene certificado emitido.
   * @param {string} serialNumber
   */
  async isCertified(serialNumber) {
    await this._ensureReady();
    return this._contractReadOnly.isCertified(serialNumber);
  }

  /**
   * Devuelve el número total de certificados emitidos.
   */
  async totalCertificates() {
    await this._ensureReady();
    const total = await this._contractReadOnly.totalCertificates();
    return Number(total);
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  _formatCert(cert) {
    return {
      id: Number(cert.id),
      productId: cert.productId,
      productName: cert.productName,
      serialNumber: cert.serialNumber,
      owner: cert.owner,
      issuedAt: new Date(Number(cert.issuedAt) * 1000),
      metadataURI: cert.metadataURI,
    };
  }

  /**
   * Genera un número de serie único con el formato AUREA-YYYY-XXXXXXXX
   */
  static generateSerialNumber() {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `AUREA-${year}-${rand}`;
  }

  /**
   * Genera una dirección Ethereum determinista a partir de un email (no es una wallet real,
   * es un hash representativo para usuarios que no tienen wallet propia).
   */
  static emailToAddress(email) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(email.toLowerCase()));
    // Tomamos los últimos 20 bytes para formar una dirección
    return ethers.getAddress("0x" + hash.slice(-40));
  }
}

// Exportar instancia singleton
module.exports = new BlockchainService();
