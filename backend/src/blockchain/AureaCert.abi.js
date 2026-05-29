/**
 * ABI mínimo del smart contract AureaCert.
 * Extraído de blockchain/contracts/AureaCert.sol
 * Actualiza este archivo si cambias el contrato y recompilas.
 */
const AUREA_CERT_ABI = [
  // Constructor
  "constructor(address _issuer)",

  // Variables públicas
  "function issuer() view returns (address)",
  "function totalCertificates() view returns (uint256)",

  // Funciones de escritura
  "function issueCertificate(string productId, string productName, string serialNumber, address owner, string metadataURI) returns (uint256 id)",
  "function transferIssuer(address newIssuer)",

  // Funciones de lectura
  "function getCertificate(uint256 id) view returns (tuple(uint256 id, string productId, string productName, string serialNumber, address owner, uint256 issuedAt, string metadataURI, bool exists))",
  "function getCertificateBySerial(string serialNumber) view returns (tuple(uint256 id, string productId, string productName, string serialNumber, address owner, uint256 issuedAt, string metadataURI, bool exists))",
  "function isCertified(string serialNumber) view returns (bool)",

  // Eventos
  "event CertificateIssued(uint256 indexed id, string indexed productId, string serialNumber, address indexed owner, uint256 issuedAt)",
  "event IssuerTransferred(address indexed previousIssuer, address indexed newIssuer)",
];

module.exports = AUREA_CERT_ABI;
