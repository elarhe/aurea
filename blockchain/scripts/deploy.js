/**
 * Script de despliegue del contrato AureaCert.
 * Uso:
 *   npx hardhat run scripts/deploy.js --network sepolia
 */
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando AureaCert con la cuenta:", deployer.address);

  // El issuer puede ser la misma cuenta del deployer o una distinta (backend).
  const issuerAddress = process.env.AUREA_ISSUER_ADDRESS || deployer.address;

  const AureaCert = await hre.ethers.getContractFactory("AureaCert");
  const contract = await AureaCert.deploy(issuerAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("AureaCert desplegado en:", address);
  console.log("Issuer autorizado:", issuerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
