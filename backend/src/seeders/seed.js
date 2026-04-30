/**
 * Seed inicial de la base de datos de Aurea.
 * Ejecutar con: node src/seeders/seed.js
 *
 * Crea:
 * - Empleado admin de prueba
 * - Usuario cliente de prueba
 * - Categorías base
 * - Productos demo con variantes
 */
require("dotenv").config();
const { connectDatabase, disconnectDatabase } = require("../config/database");
const { User, Employee, Category, Product } = require("../models");

async function run() {
  await connectDatabase();
  console.log("Limpiando colecciones de demo...");

  await Promise.all([
    User.deleteMany({ email: /@aurea\.demo$/ }),
    Employee.deleteMany({ email: /@aurea\.demo$/ }),
    Category.deleteMany({ slug: { $in: ["mujer", "hombre", "accesorios", "vestidos", "camisas"] } }),
    Product.deleteMany({ slug: { $in: ["vestido-aurora", "camisa-lino-blanca", "bolso-piel-marron"] } }),
  ]);

  console.log("Creando empleado admin...");
  await Employee.create({
    firstName: "Admin",
    lastName: "Aurea",
    email: "admin@aurea.demo",
    password: "Admin12345!",
    role: "admin",
    department: "Dirección",
  });

  console.log("Creando cliente de prueba...");
  await User.create({
    firstName: "Elena",
    lastName: "Cliente",
    email: "cliente@aurea.demo",
    password: "Cliente12345!",
    emailVerified: true,
  });

  console.log("Creando categorías...");
  const [mujer, hombre, accesorios] = await Category.create([
    { name: "Mujer", slug: "mujer", order: 1 },
    { name: "Hombre", slug: "hombre", order: 2 },
    { name: "Accesorios", slug: "accesorios", order: 3 },
  ]);

  const vestidos = await Category.create({
    name: "Vestidos",
    slug: "vestidos",
    parent: mujer._id,
    order: 1,
  });
  const camisas = await Category.create({
    name: "Camisas",
    slug: "camisas",
    parent: hombre._id,
    order: 1,
  });

  console.log("Creando productos demo...");
  await Product.create([
    {
      name: "Vestido Aurora",
      slug: "vestido-aurora",
      description: "Vestido midi de seda con caída fluida y corte favorecedor.",
      shortDescription: "Vestido midi de seda con caída fluida.",
      category: vestidos._id,
      tags: ["vestido", "seda", "verano"],
      price: 189.0,
      compareAtPrice: 219.0,
      coverImage: "/uploads/demo/vestido-aurora.jpg",
      images: ["/uploads/demo/vestido-aurora.jpg"],
      materials: ["100% Seda"],
      countryOfOrigin: "España",
      variants: [
        { sku: "AUR-VST-AUR-S", size: "S", color: "Marfil", stock: 5 },
        { sku: "AUR-VST-AUR-M", size: "M", color: "Marfil", stock: 8 },
        { sku: "AUR-VST-AUR-L", size: "L", color: "Marfil", stock: 3 },
      ],
      isActive: true,
      isFeatured: true,
      publishedAt: new Date(),
    },
    {
      name: "Camisa de lino blanca",
      slug: "camisa-lino-blanca",
      description: "Camisa de lino 100% natural, perfecta para el verano.",
      shortDescription: "Camisa de lino, transpirable y elegante.",
      category: camisas._id,
      tags: ["camisa", "lino", "hombre"],
      price: 79.0,
      coverImage: "/uploads/demo/camisa-lino.jpg",
      materials: ["100% Lino"],
      countryOfOrigin: "Portugal",
      variants: [
        { sku: "AUR-CAM-LIN-M", size: "M", color: "Blanco", stock: 12 },
        { sku: "AUR-CAM-LIN-L", size: "L", color: "Blanco", stock: 7 },
      ],
      isActive: true,
      publishedAt: new Date(),
    },
    {
      name: "Bolso de piel marrón",
      slug: "bolso-piel-marron",
      description: "Bolso shopper de piel curtida vegetal, hecho a mano.",
      shortDescription: "Bolso shopper de piel hecho a mano.",
      category: accesorios._id,
      tags: ["bolso", "piel", "accesorio"],
      price: 245.0,
      coverImage: "/uploads/demo/bolso-piel.jpg",
      materials: ["Piel curtida vegetal"],
      countryOfOrigin: "Italia",
      variants: [{ sku: "AUR-BOL-PIE-U", size: "Único", color: "Marrón", stock: 4 }],
      isActive: true,
      isFeatured: true,
      publishedAt: new Date(),
    },
  ]);

  console.log("Seed completado correctamente.");
  await disconnectDatabase();
}

run().catch(async (err) => {
  console.error("Error en seed:", err);
  await disconnectDatabase();
  process.exit(1);
});
