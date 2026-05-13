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
| `phone`, `birthDate`, `gender` | – | Datos personales |
| `avatar` | String (URL) | Imagen de perfil |
| `dni` | String | DNI/NIE para facturas |
| `preferredLanguage` | enum (`es`, `en`, `ca`) | Idioma preferido |
| `preferredCurrency` | String | Moneda preferida (default EUR) |
| `addresses[]` | ref Address | Direcciones del usuario |
| `defaultAddress` | ref Address | Dirección por defecto |
| `wishlist[]` | ref Product | Lista de deseos |
| `walletAddress` | String | Wallet ETH opcional para certificados |
| `newsletter`, `marketingConsent`, `marketingConsentDate` | – | Cumplimiento RGPD |
| `loyaltyPoints` | Number | Puntos de fidelidad |
| `referralCode`, `referredBy` | – | Programa de referidos |
| `isActive`, `emailVerified` | Boolean | Estado |
| `lastLoginAt`, `loginCount`, `createdAt`, `updatedAt` | Date | Auditoría |

### employees
Personal interno con acceso al panel backoffice.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `email` | String (unique) | Login |
| `password` | String (bcrypt) | – |
| `role` | enum (`admin`, `manager`, `staff`) | Control de acceso |
| `permissions[]` | String | Permisos granulares |
| `department`, `jobTitle` | – | Datos laborales |
| `phone`, `dni`, `avatar` | – | Datos personales |
| `hireDate` | Date | Fecha de contratación |
| `notes` | String | Notas internas de RRHH |
| `isActive`, `lastLoginAt`, `loginCount` | – | Auditoría |

### addresses
Direcciones de envío/facturación de los clientes.

Campos: `user → User`, `label`, `recipient`, `phone`, `line1`, `line2`, `city`, `state`,
`postalCode`, `country`, `countryCode` (ISO-3166-1), `type` (`shipping`/`billing`/`both`),
`deliveryInstructions`, `coordinates{lat,lng}`, `isDefault`.

### categories
Categorías y subcategorías (árbol auto-referenciado por `parent`).

| Campo | Tipo |
| --- | --- |
| `name`, `slug` (unique) | String |
| `parent` | ref Category (null = raíz) |
| `image`, `bannerImage`, `icon` | URLs |
| `description`, `order`, `isActive`, `isFeatured` | – |
| `metaTitle`, `metaDescription`, `metaKeywords[]` | SEO |
| `productCount` | Number (denormalizado) |

### products
Catálogo principal con variantes embebidas (talla/color).

**Información básica:** `name`, `slug`, `description`, `shortDescription`, `brand`,
`category`, `subcategories[]`, `tags[]`.

**Clasificación de moda:** `gender` (female/male/unisex/kids),
`season` (spring/summer/autumn/winter/all-year), `collection`, `style`.

**Precios:** `price`, `compareAtPrice`, `costPrice` (interno), `currency`, `taxRate`.

**Multimedia:** `images[]`, `coverImage`, `videoUrl`, `sizeGuideUrl`.

**Variantes** (embebidas): `sku`, `barcode`, `size`, `color`, `colorHex`, `stock`,
`reservedStock`, `lowStockThreshold`, `priceOverride`, `weightGrams`, `images[]`.

**Composición y materiales:** `materials[]`, `composition`, `careInstructions`,
`careSymbols[]`, `countryOfOrigin`, `weightGrams`.

**Sostenibilidad:** `sustainabilityScore` (0-100), `sustainabilityBadges[]`
(ej. GOTS, Fair Trade), `isVegan`, `isHandmade`.

**Blockchain:** `certifiable`, `requiresCertificate`.

**SEO:** `metaTitle`, `metaDescription`, `metaKeywords[]`.

**Estado y ciclo de vida:** `isActive`, `isFeatured`, `isNew`, `isLimited`,
`publishedAt`, `launchDate`, `discontinuedAt`.

**Relaciones / métricas:** `relatedProducts[]`, `rating`, `reviewCount`, `soldCount`,
`viewCount`, `wishlistCount`.

Índices: full-text sobre `name + description + tags`, `category + isActive`, `price`.

### carts
Un carrito por usuario (`unique: user`). Carrito de invitado opcional por `guestSessionId`.

Campos: `user`, `guestSessionId`, `items[{ product, variantSku, quantity, unitPrice }]`,
`subtotal`, `discount`, `couponCode`, `estimatedShipping`, `estimatedTax`,
`estimatedTotal`, `currency`, `expiresAt` (TTL automático).

Método `recalculate()` recalcula `subtotal`.

### orders
Pedidos completados/pendientes. Almacena snapshots inmutables.

**Identificación:** `orderNumber` (unique), `user`, `sourceChannel` (web/mobile/manual),
`ipAddress`, `userAgent`.

**Items:** snapshots con `productName`, `sku`, `variant`, `quantity`, `unitPrice`,
`subtotal`, `image`, `certificate` (ref).

**Direcciones (snapshot):** `shippingAddress`, `billingAddress`.

**Importes:** `subtotal`, `shippingCost`, `tax`, `discount`, `total`, `couponCode`, `currency`.

**Estado:** `status` (pending|paid|processing|shipped|delivered|cancelled|refunded)
con `statusHistory[]` para timeline.

**Pago:** `payment{ provider, status, transactionId, paidAt }`.

**Envío:** `shipping{ carrier, trackingNumber, shippedAt, deliveredAt }`,
`expectedDeliveryDate`.

**Facturación:** `invoiceNumber` (unique), `invoiceUrl`, `invoiceIssuedAt`.

**Regalo:** `isGift`, `giftMessage`, `giftWrap`.

**Devoluciones / cancelación:** `returnDeadline`, `refundedAmount`, `refundReason`,
`cancelledAt`, `cancellationReason`.

**Blockchain:** `certificatesIssued`.

**Auditoría:** `notes` (interna), `customerNotes`, `employeeAssigned`.

### certificates
Puente entre el pedido y el smart contract `AureaCert.sol`.

**Identificación:** `certificateId` (id del contrato), `serialNumber` (unique).

**Relaciones:** `product`, `productName`, `order`, `user`, `productSnapshot`.

**On-chain:** `network`, `contractAddress`, `transactionHash`, `blockNumber`,
`issuerAddress`, `ownerAddress`, `metadataURI`.

**Estado:** `status` (pending|issued|failed|revoked), `issuedAt`, `revokedAt`,
`revocationReason`, `error`.

**Verificación pública:** `publicSlug` (URL corta), `qrCodeUrl`, `verificationCount`,
`lastVerifiedAt`.

**Detalles técnicos:** `gasUsed`, `gasPriceWei`, `transactionFeeEth`.

**Reventa:** `transferHistory[]` (de/a/txHash/fecha) para trazar el cambio de propietario
si el cliente revende su prenda.

### reviews
Una reseña por (producto, usuario) — índice único compuesto.

**Valoración:** `rating` 1-5, `qualityRating`, `valueRating`,
`sizeFeedback` (small/true_to_size/large).

**Contenido:** `title`, `comment`, `images[]`, `videoUrl`.

**Estado:** `verifiedPurchase`, `isApproved`, `helpfulCount`, `notHelpfulCount`.

**Moderación:** `reported`, `reportedReason`, `moderatedBy`, `moderatedAt`.

**Respuesta de la marca:** `reply{ message, author, repliedAt }`.

### coupons
Cupones de descuento por porcentaje o cantidad fija.

**Definición:** `code` (unique, uppercase), `description`, `discountType`
(`percentage`/`fixed`), `discountValue`, `minPurchase`, `maxDiscount`.

**Limitaciones:** `usageLimit`, `usageCount`, `perUserLimit`, `usedByUsers[]`,
`firstOrderOnly`, `stackable`.

**Vigencia:** `validFrom`, `validUntil`.

**Alcance:** `appliesTo{categories, products}`, `excludedCategories[]`,
`excludedProducts[]`, `freeShipping`.

**Afiliados / influencers:** `affiliate{ isAffiliate, name, commissionPercent }`.

---

## Relaciones principales

```
User ──< Address
User ──< Cart ──< CartItem ──> Product (variant SKU)
User ──< Order ──< OrderItem ──> Product
                  └── Certificate ──> Product, User, Order
User ──< Review ──> Product
User ──< Wishlist ──> Product
User ──> User (referredBy)
Product ──> Category ──< Category (parent)
Product ──< Product (relatedProducts)
Order ──> Employee (asignado)
Order ──< StatusHistory ──> Employee
Coupon ──< Order (couponCode)
Coupon ──< User (usedByUsers)
Review ──> Employee (moderatedBy, reply.author)
```

## Convenciones

- Todas las colecciones usan `timestamps: true` (`createdAt`, `updatedAt`).
- Las contraseñas se hashean con bcrypt (`BCRYPT_SALT_ROUNDS`, default 12) y nunca se exponen.
- Los precios se almacenan en `Number` con 2 decimales y moneda EUR por defecto.
- **Snapshots:** `Order` y `Certificate` guardan datos inmutables del producto y la dirección al momento de la compra para mantener integridad histórica.
- El campo `expiresAt` del carrito tiene índice TTL — MongoDB borra automáticamente carritos abandonados.
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
