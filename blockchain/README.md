# Aurea — Blockchain

Smart contracts del ecosistema Aurea. Contiene `AureaCert.sol`, responsable de la emisión y verificación de certificados de autenticidad on-chain.

## Scripts

```bash
npm install
npm run compile         # Compila los contratos
npm run test            # Ejecuta los tests
npm run node            # Nodo Hardhat local
npm run deploy:local    # Despliegue en el nodo local
npm run deploy:sepolia  # Despliegue en Sepolia (requiere .env)
```

## Variables de entorno

Crea un `.env` en esta carpeta con:

```
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/TU_API_KEY
BLOCKCHAIN_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
AUREA_ISSUER_ADDRESS=0x... (opcional)
```
