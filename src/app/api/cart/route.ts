import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";

// Returns the live price/stock for the variants in a cart, so the cart page can refresh stale lines.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string").slice(0, 50) : [];
  if (!ids.length) return NextResponse.json({ variants: [] });
  const rows = await db.query.variants.findMany({ where: inArray(schema.variants.id, ids), with: { product: true } });
  return NextResponse.json({
    variants: rows.map((v) => ({
      id: v.id,
      price: v.price,
      stock: v.stock,
      available: v.active && v.product.active,
      name: v.product.name,
      label: v.label,
    })),
  });
}
