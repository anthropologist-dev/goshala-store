// Seeds the catalogue from the current Hostinger site, the store settings and the first admin.
// Safe to re-run: existing rows (matched by slug / sku / email) are left alone.
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { IMG } from "../src/lib/images";

type Seed = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  usage: string[];
  images: string[];
  category: string;
  featured?: boolean;
  active?: boolean;
  variants: { label: string; sku: string; price: number; weightGrams: number; stock: number }[];
};

const catalogue: Seed[] = [
  {
    slug: "tamaragaoura",
    name: "TaamraGoura",
    tagline: "The world's first cow-dung based cleansing powder with desi cow ghee",
    description:
      "A chemical-free, zero-foam cleaning powder made from cow dung, cow urine, desi cow ghee and Ayurvedic herbs. It brings back the natural shine of copper, brass, bronze and steel utensils, idols and pooja articles.",
    features: [
      "Made from cow dung, gomutra, desi cow ghee and Ayurvedic herbs",
      "Cleans copper, brass, silver, gold, bronze, steel and clay without scratching",
      "100% biodegradable and gentle on hands",
      "For utensils, idols and pooja items",
      "Rinse water doubles as liquid fertiliser for plants",
    ],
    usage: [
      "Dip the vessel or idol in water and take it out.",
      "Sprinkle about half a teaspoon of powder over it.",
      "Rub gently by hand or with a damp sponge.",
      "Rinse well with water.",
      "Pour the rinse water into your plants.",
    ],
    images: [IMG.products.taamragoura],
    category: "Cleaning",
    featured: true,
    variants: [{ label: "250 g", sku: "TG-250", price: 12500, weightGrams: 300, stock: 50 }],
  },
  {
    slug: "pushpaka-vimana",
    name: "Pushpaka Vimana Dhoop Cones",
    tagline: "Hand-rolled dhoop cones rich in desi cow ghee",
    description:
      "Hand-rolled dhoop cones made from cow dung, desi cow ghee and herbs. The high ghee content gives a slow, even burn and a steady Agnihotra-like fragrance for pooja, yoga and meditation.",
    features: [
      "Hand-rolled from cow dung, desi cow ghee and herbs",
      "High ghee content for a slow, steady burn",
      "Agnihotra-style fragrance",
      "For pooja, yoga and Agnihotra",
      "Biodegradable",
    ],
    usage: [
      "Place a cone on a heat-safe stand or plate.",
      "Light the tip and let it catch for a few seconds.",
      "Gently blow out the flame and let it smoulder.",
    ],
    images: [IMG.products.pushpakavimana, IMG.pushpakaBanner],
    category: "Dhoop",
    featured: true,
    variants: [{ label: "Bottle of 50 cones", sku: "PV-50", price: 12500, weightGrams: 250, stock: 50 }],
  },
  {
    slug: "gomaya-powder",
    name: "Gomaya Powder",
    tagline: "Natural floor cleaner from Malnad Gidda cow dung",
    description:
      "Sun-dried dung of indigenous Malnad Gidda cows blended with desi cow ghee residue. A natural, chemical-free floor cleaner for cement, mosaic, stone and granite floors, made by women-led local artisan groups.",
    features: [
      "Sun-dried Malnad Gidda cow dung with desi cow ghee residue",
      "Natural, chemical-free and biodegradable",
      "Freshens and deodorises the home",
      "For cement, mosaic, stone and granite floors",
      "Made by women-led artisan groups",
    ],
    usage: [
      "Stir one level teaspoon into a bucket of water.",
      "Keep stirring until it fully dissolves.",
      "Mop or sweep the floor as usual.",
      "Pour leftover water into potted plants or the garden.",
    ],
    images: [IMG.products.gomaya],
    category: "Cleaning",
    featured: true,
    variants: [{ label: "125 g", sku: "GP-125", price: 10000, weightGrams: 150, stock: 50 }],
  },
  // Listed on the Mission page but not priced on the live site yet.
  // Seeded as hidden drafts: set price, stock and images in Admin → Products, then publish.
  ...[
    ["gorakshakavacha", "Gorakshakavacha", "GK"],
    ["agnihotra-bherani", "Agnihotra Bherani", "AB"],
    ["pradhana-dhoopa", "Pradhana Dhoopa", "PD"],
  ].map(([slug, name, code]) => ({
    slug,
    name,
    tagline: "",
    description: "",
    features: [],
    usage: [],
    images: [IMG.poojaEssentials],
    category: "Pooja Essentials",
    active: false,
    variants: [{ label: "Standard", sku: `${code}-STD`, price: 10000, weightGrams: 250, stock: 0 }],
  })),
];

async function main() {
  for (const [i, p] of catalogue.entries()) {
    const existing = await db.query.products.findFirst({ where: eq(schema.products.slug, p.slug) });
    if (existing) continue;
    const { variants, ...rest } = p;
    const [row] = await db
      .insert(schema.products)
      .values({ ...rest, active: p.active ?? true, featured: p.featured ?? false, sortOrder: i })
      .returning();
    for (const v of variants) {
      const [vr] = await db.insert(schema.variants).values({ ...v, productId: row.id }).returning();
      if (v.stock > 0)
        await db.insert(schema.stockMovements).values({
          variantId: vr.id,
          delta: v.stock,
          reason: "RESTOCK",
          note: "Opening stock",
          balance: v.stock,
        });
    }
    console.log("Seeded product", p.name);
  }

  const s = await db.query.settings.findFirst();
  if (!s) await db.insert(schema.settings).values({ id: 1 });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const found = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email.toLowerCase()) });
    if (!found) {
      await db.insert(schema.adminUsers).values({ email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) });
      console.log("Created admin", email);
    }
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set; no admin user created");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
