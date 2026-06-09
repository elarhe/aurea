require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

const traducciones = [
  // ── MUJER ──────────────────────────────────────────────────────
  {
    slug: "blazer-crema-estructurado",
    name_en: "Structured Cream Blazer",
    name_uk: "Структурований кремовий блейзер",
    description_en: "Straight-cut blazer in cream tone, perfect for office looks or casual chic.",
    description_uk: "Блейзер прямого крою кремового кольору — ідеальний для офісного або casual chic образу.",
    shortDescription_en: "Structured blazer in cream.",
    shortDescription_uk: "Структурований блейзер кремового кольору.",
  },
  {
    slug: "vestido-camisero-rayas",
    name_en: "Striped Shirt Dress",
    name_uk: "Сорочкова сукня в смужку",
    description_en: "Midi shirt dress with vertical stripes, mother-of-pearl buttons and included belt.",
    description_uk: "Міді-сукня сорочкового фасону з вертикальними смужками, перламутровими ґудзиками та поясом у комплекті.",
    shortDescription_en: "Midi shirt dress with stripes.",
    shortDescription_uk: "Міді-сукня в смужку.",
  },
  {
    slug: "pantalon-wide-leg-beige",
    name_en: "Beige Wide Leg Trousers",
    name_uk: "Бежеві широкі штани",
    description_en: "High-waist wide-leg trousers in beige. Fluid fabric with front pleats.",
    description_uk: "Широкі штани з високою посадкою бежевого кольору. М'яка тканина з передніми защипами.",
    shortDescription_en: "Wide leg trousers in beige.",
    shortDescription_uk: "Широкі штани бежевого кольору.",
  },
  {
    slug: "top-asimetrico-negro",
    name_en: "Black Asymmetric Top",
    name_uk: "Чорний асиметричний топ",
    description_en: "Top with asymmetric shoulder in black stretch fabric. Ideal for special occasions.",
    description_uk: "Топ з асиметричним плечем із чорної еластичної тканини. Ідеальний для особливих випадків.",
    shortDescription_en: "Asymmetric top in black.",
    shortDescription_uk: "Асиметричний топ чорного кольору.",
  },
  {
    slug: "falda-midi-plisada-terracota",
    name_en: "Terracotta Pleated Midi Skirt",
    name_uk: "Теракотова плісирована міді-спідниця",
    description_en: "Pleated midi skirt in terracotta tone. Elastic waist and fluid drape.",
    description_uk: "Плісирована міді-спідниця теракотового кольору. Еластичний пояс та плавний крій.",
    shortDescription_en: "Terracotta pleated midi skirt.",
    shortDescription_uk: "Теракотова плісирована міді-спідниця.",
  },

  // ── HOMBRE ─────────────────────────────────────────────────────
  {
    slug: "chaqueta-varsity-marron",
    name_en: "Brown Varsity Jacket",
    name_uk: "Коричнева куртка-варсіті",
    description_en: "Varsity-style jacket in brown faux leather with cream trim.",
    description_uk: "Куртка у стилі варсіті з коричневої штучної шкіри з кремовою окантовкою.",
    shortDescription_en: "Brown varsity jacket with cream trim.",
    shortDescription_uk: "Коричнева куртка-варсіті з кремовою окантовкою.",
  },
  {
    slug: "pantalon-cargo-oliva",
    name_en: "Olive Cargo Trousers",
    name_uk: "Оливкові карго-штани",
    description_en: "Olive cargo trousers with side pockets and regular fit.",
    description_uk: "Оливкові карго-штани з бічними кишенями та прямим кроєм.",
    shortDescription_en: "Cargo trousers in olive.",
    shortDescription_uk: "Карго-штани оливкового кольору.",
  },
  {
    slug: "sudadera-oversized-gris",
    name_en: "Grey Oversized Sweatshirt",
    name_uk: "Сіре оверсайз-худі",
    description_en: "Oversized sweatshirt in heathered grey. Fleece interior for extra comfort.",
    description_uk: "Худі оверсайз-крою в сірому меланжі. М'яка внутрішня підкладка для максимального комфорту.",
    shortDescription_en: "Oversized sweatshirt in heathered grey.",
    shortDescription_uk: "Оверсайз-худі в сірому меланжі.",
  },
  {
    slug: "polo-pique-navy",
    name_en: "Navy Piqué Polo",
    name_uk: "Поло піке темно-синього кольору",
    description_en: "Classic piqué polo in navy blue. Two-button collar and straight hem.",
    description_uk: "Класичне поло піке темно-синього кольору. Комір на два ґудзики та прямий низ.",
    shortDescription_en: "Navy blue piqué polo.",
    shortDescription_uk: "Поло піке темно-синього кольору.",
  },
  {
    slug: "abrigo-pano-camel",
    name_en: "Camel Wool Coat",
    name_uk: "Верблюжа вовняна шуба",
    description_en: "Long wool coat in camel. Straight cut, gold buttons and inner lining.",
    description_uk: "Довге пальто з вовни кольору кемел. Прямий крій, золоті ґудзики та підкладка.",
    shortDescription_en: "Long camel wool coat.",
    shortDescription_uk: "Довге пальто кольору кемел.",
  },

  // ── ACCESORIOS ─────────────────────────────────────────────────
  {
    slug: "cinturon-piel-trenzado",
    name_en: "Braided Leather Belt",
    name_uk: "Плетений шкіряний ремінь",
    description_en: "Braided genuine leather belt in tan. Gold buckle.",
    description_uk: "Плетений ремінь із натуральної шкіри рудого кольору. Золота пряжка.",
    shortDescription_en: "Braided leather belt in tan.",
    shortDescription_uk: "Плетений шкіряний ремінь рудого кольору.",
  },
  {
    slug: "sombrero-fedora-beige",
    name_en: "Beige Wide-Brim Fedora",
    name_uk: "Бежевий федора з широкими полями",
    description_en: "Wide-brim fedora in beige felt. Decorative black ribbon.",
    description_uk: "Федора з широкими полями з бежевого фетру. Декоративна чорна стрічка.",
    shortDescription_en: "Beige wide-brim felt fedora.",
    shortDescription_uk: "Бежевий фетровий федора з широкими полями.",
  },
  {
    slug: "gafas-sol-retro-doradas",
    name_en: "Retro Gold Sunglasses",
    name_uk: "Ретро сонцезахисні окуляри в золотій оправі",
    description_en: "Sunglasses with gold metal frame and amber-tinted lenses. UV400 protection.",
    description_uk: "Сонцезахисні окуляри з металевою золотою оправою та лінзами у бурштиновому відтінку. Захист UV400.",
    shortDescription_en: "Retro sunglasses with gold frame.",
    shortDescription_uk: "Ретро окуляри в золотій оправі.",
  },
  {
    slug: "panuelo-seda-floral",
    name_en: "Floral Silk Scarf",
    name_uk: "Квітковий шовковий шарф",
    description_en: "100% silk scarf with floral print in pastel tones. Versatile and elegant.",
    description_uk: "Шарф зі 100% шовку з квітковим принтом у пастельних тонах. Універсальний та елегантний.",
    shortDescription_en: "Floral pastel silk scarf.",
    shortDescription_uk: "Квітковий шарф із шовку в пастелі.",
  },
  {
    slug: "cartera-piel-minimalista",
    name_en: "Minimalist Leather Wallet",
    name_uk: "Мінімалістичний шкіряний гаманець",
    description_en: "Slim natural leather wallet with 6 card slots and bill compartment. Minimalist design.",
    description_uk: "Тонкий гаманець з натуральної шкіри з 6 відсіками для карток та купюрником. Мінімалістичний дизайн.",
    shortDescription_en: "Minimalist natural leather wallet.",
    shortDescription_uk: "Мінімалістичний гаманець із натуральної шкіри.",
  },
];

async function traducir() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[Aurea] Conectado a MongoDB");

    let actualizados = 0;
    let noEncontrados = 0;

    for (const t of traducciones) {
      const { slug, ...campos } = t;
      const resultado = await Product.updateOne({ slug }, { $set: campos });
      if (resultado.matchedCount === 0) {
        console.log(`⚠ No encontrado: ${slug}`);
        noEncontrados++;
      } else {
        console.log(`✓ Traducido: ${slug}`);
        actualizados++;
      }
    }

    console.log(`\n✅ ${actualizados} productos traducidos`);
    if (noEncontrados > 0) console.log(`⚠ ${noEncontrados} slugs no encontrados en la BD`);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("[Aurea] Desconectado");
  }
}

traducir();
