# Aurea — Esquema de la base de datos

Base de datos: **MongoDB** (Mongoose ODM)
Nombre: `aurea`

## Colecciones

### users
Clientes registrados de la tienda. Autenticación con email + bcrypt.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `_id` | ObjectId | PK |
| `firstName`, `lastName` | String | Nombre completo |
| `email` | String (unique) | Login |
| `password` | String (bcrypt) | Hash, `select: false` |
| `phone`, `birthDate`, `gender` | – | Datos opcionales |
| `addresses[]` | ref Address | Direcciones del usuario |
| `defaultAddress` | ref Address | Dirección por defecto |
| `wishlist[]` | ref Product | Lista de deseos |
| `walletAddress` | String | Wallet ETH opcional para certificados |
| `isActive`, `emailVerified` | Boolean | Estado |
| `lastLoginAt`, `createdAt`, `updatedAt` | Date | Auditoría |

### employees
Personal interno con acceso al panel backoffice.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `email` | String (unique) | Login |
| `password` | String (bcrypt) | – |
| `role` | enum (`admin`, `manager`, `staff`) | Control de acceso |
| `permissions[]` | String | Permisos granulares |
| `department`, `isActive` | – | – |

### addresses
Direcciones de envío/facturación de los clientes.

`user → User`, campos típicos de dirección postal, `isDefault`.

### categories
Categorías y subcategorías (árbol auto-referenciado por `parent`).

| Campo | Tipo |
| --- | --- |
| `name`, `slug` (unique) | String |
| `parent` | ref Category (null = raíz) |
| `image`, `description`, `order`, `isActive` | – |

### products
Catálogo principal con variantes embebidas (talla/color).

Campos clave: `name`, `slug`, `description`, `category`, `price`, `compareAtPrice`,
`taxRate`, `images[]`, `coverImage`, `variants[{ sku, size, color, stock }]`,
`materials[]`, `careInstructions`, `countryOfOrigin`, `certifiable`,
`isActive`, `isFeatured`, `rating`, `reviewCount`, `soldCount`.

Índices: full-text sobre `name + description + tags`, `category + isActive`, `price`.

### carts
Un carrito por usuario (`unique: user`). Cada item guarda `product`, `variantSku`,
`quantity`, `unitPrice` (snapshot). Método `recalculate()` recalcula `subtotal`.

### orders
Pedidos completados/pendientes. Almacena snapshots inmutables.

Campos: `orderNumber` (unique), `user`, `items[]`, `shippingAddress`, `billingAddress`,
`subtotal`, `shippingCost`, `tax`, `discount`, `total`, `couponCode`,
`status` (pending|paid|processing|shipped|delivered|cancelled|refunded),
`payment{ provider, status, transactionId, paidAt }`,
`shipping{ carrier, trackingNumber, shippedAt, deliveredAt }`,
`employeeAssigned`, `certificatesIssued`.

### certificates
Puente entre el pedido y el smart contract `AureaCert.sol`.

Campos: `certificateId` (id devuelto por el contrato), `serialNumber` (unique),
`product`, `productName`, `order`, `user`, `productSnapshot`,
`network`, `contractAddress`, `transactionHash`, `blockNumber`,
`issuerAddress`, `ownerAddress`, `metadataURI`,
`status` (pending|issued|failed|revoked), `issuedAt`, `error`.

### reviews
Una reseña por (producto, usuario) — índice único compuesto.
`rating` 1-5, `verifiedPurchase`, `isApproved`, `helpfulCount`.

### coupons
Cupones de descuento por porcentaje o cantidad fija. Limitación por uso global y por usuario.
Filtros opcionales por categoría/producto. Validez por fechas.

---

## Relaciones principales

```
User ──< Address
User ──< Cart ──< CartItem ──> Product (variant SKU)
User ──< Order ──< OrderItem ──> Product
                  └── Certificate ──> Product, User, Order
User ──< Review ──> Product
User ──< Wishlist ──> Product
Product ──> Category ──< Category (parent)
Order ──> Employee (asignado)
Coupon ──< Order (couponCode)
```

## Convenciones

- Todas las colecciones usan `timestamps: true` (`createdAt`, `updatedAt`).
- Las contraseñas se hashean con bcrypt (`BCRYPT_SALT_ROUNDS`, default 12) y nunca se exponen.
- Los precios se almacenan en céntimos enteros sólo si se requiere alta precisión; actualmente se usan `Number` con 2 decimales y moneda EUR por defecto.
- Snapshots: `Order` y `Certificate` guardan datos inmutables del producto y la dirección al momento de la compra para mantener integridad histórica.
- Los índices se crean automáticamente en desarrollo (`autoIndex: true`) y manualmente en producción.

## Cómo ejecutar el seed

```bash
cd backend
cp .env.example .env  # configurar MONGO_URI
npm install
npm run seed
```

Esto crea:
- Empleado: `admin@aurea.demo / Admin12345!`
- Cliente: `cliente@aurea.demo / Cliente12345!`
- 3 categorías raíz + 2 subcategorías
- 3 productos demo con variantes
