import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export async function getProducts(opts: { featuredOnly?: boolean } = {}) {
  const rows = await db.query.products.findMany({
    where: and(eq(schema.products.active, true), opts.featuredOnly ? eq(schema.products.featured, true) : undefined),
    orderBy: [asc(schema.products.sortOrder), asc(schema.products.name)],
    with: { variants: { where: eq(schema.variants.active, true), orderBy: asc(schema.variants.price) } },
  });
  return rows.filter((p) => p.variants.length > 0);
}

export async function getProduct(slug: string) {
  return db.query.products.findFirst({
    where: and(eq(schema.products.slug, slug), eq(schema.products.active, true)),
    with: { variants: { where: eq(schema.variants.active, true), orderBy: asc(schema.variants.price) } },
  });
}

export type CatalogProduct = Awaited<ReturnType<typeof getProducts>>[number];
