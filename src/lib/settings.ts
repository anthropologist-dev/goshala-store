import { db, schema } from "@/db";

export async function getSettings() {
  const s = await db.query.settings.findFirst();
  if (s) return s;
  const [created] = await db.insert(schema.settings).values({ id: 1 }).returning();
  return created;
}

export function shippingFor(subtotal: number, s: { freeShippingThreshold: number; flatShippingFee: number }) {
  return subtotal >= s.freeShippingThreshold ? 0 : s.flatShippingFee;
}
