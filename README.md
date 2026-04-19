# Aurea — Plataforma de e-commerce de moda con certificación blockchain

> Trabajo de Fin de Grado (DAW) — Desarrollo de Aplicaciones Web

Aurea es una plataforma integral de e-commerce de moda que combina una experiencia de compra moderna con **certificados de autenticidad verificables en blockchain**. Cada producto vendido queda registrado de forma inmutable en un smart contract desplegado en una testnet de Ethereum, permitiendo al cliente verificar la autenticidad y trazabilidad de su prenda.

---

## Arquitectura del proyecto

El repositorio está organizado como un **monorepo** con cinco aplicaciones independientes que comparten infraestructura y convenciones:

| Módulo | Tecnología | Descripción |
| --- | --- | --- |
| `frontend-tienda/` | React + Vite | Tienda pública para clientes finales |
| `frontend-empleados/` | React + Vite | Panel backoffice para gestión de catálogo, pedidos y clientes |
| `mobile-app/` | React Native (Expo) | Aplicación móvil nativa para iOS y Android |
| `backend/` | Node.js + Express | API REST con autenticación JWT |
| `blockchain/` | Solidity + Hardhat | Smart contract `AureaCert.sol` (certificados de autenticidad) |

---

## Características principales

- Catálogo de productos con imágenes, variantes y stock en tiempo real.
- Carrito de compra, pago y gestión de pedidos.
- Autenticación de usuarios y empleados mediante JWT con roles.
- Panel de administración con métricas y gestión operativa.
- Aplicación móvil con las mismas funcionalidades que la tienda web.
- Emisión automática de un **certificado de autenticidad en blockchain** por cada compra.
- Verificación pública del certificado mediante su hash.

---

## Requisitos previos

- Node.js ≥ 20.x
- npm ≥ 10.x
- Git
- MongoDB (local o Atlas) para el backend
- Una wallet de pruebas con ETH de testnet (Sepolia) para desplegar el smart contract
- Expo CLI para la aplicación móvil (`npm install -g expo-cli`)

---

## Instalación rápida

```bash
# Clonar el repositorio
git clone https://github.com/elarhe/aurea.git
cd aurea

# Instalar dependencias en cada módulo
cd backend && npm install && cd ..
cd frontend-tienda && npm install && cd ..
cd frontend-empleados && npm install && cd ..
cd mobile-app && npm install && cd ..
cd blockchain && npm install && cd ..
```

### Configuración del backend

```bash
cd backend
cp .env.example .env
# Editar .env con las credenciales reales
npm run dev
```

### Configuración del smart contract

```bash
cd blockchain
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```

---

## Estructura de carpetas

```
aurea/
├── backend/              API REST en Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── routes/
│   └── .env.example
├── blockchain/           Smart contracts en Solidity
│   ├── contracts/
│   │   └── AureaCert.sol
│   ├── scripts/
│   └── test/
├── frontend-tienda/      Tienda pública (React)
│   └── src/
├── frontend-empleados/   Panel backoffice (React)
│   └── src/
├── mobile-app/           App móvil (React Native)
│   └── src/
├── .gitignore
└── README.md
```

---

## Planificación por semanas (TFG)

- **Semana 0** — Estructura base del proyecto, repositorio y documentación inicial.
- **Semana 1-2** — Backend: modelos, autenticación JWT y endpoints principales.
- **Semana 3-4** — Frontend tienda: catálogo, carrito y checkout.
- **Semana 5-6** — Frontend empleados: panel de gestión.
- **Semana 7-8** — Smart contract y emisión de certificados.
- **Semana 9-10** — App móvil.
- **Semana 11-12** — Integración, pruebas y despliegue.
- **Semana 13** — Memoria y defensa.

---

## Licencia

Proyecto académico desarrollado como Trabajo de Fin de Grado del ciclo formativo de Desarrollo de Aplicaciones Web (DAW).

## Autoría

Desarrollado por **Elena y Bohdan** — 2026.
