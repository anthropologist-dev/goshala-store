import { and, desc, eq, gte, ilike, inArray, lte, or, type SQL } from "drizzle-orm";
import { schema } from "@/db";

const o = schema.orders;

export const ORDER_FILTERS = [
  ["ALL", "All"],
  ["PENDING", "New"],
  ["VERIFY", "Verify UPI"],
  ["TO_SHIP", "To ship"],
  ["SHIPPED", "Shipped"],
  ["DELIVERED", "Delivered"],
  ["CANCELLED", "Cancelled"],
] as const;

export function orderWhere(p: { status?: string; q?: string; from?: string; to?: string }) {
  const c: (SQL | undefined)[] = [];
  switch (p.status) {
    case "PENDING":
    case "SHIPPED":
    case "DELIVERED":
      c.push(eq(o.status, p.status));
      break;
    case "CANCELLED":
      c.push(inArray(o.status, ["CANCELLED", "RETURNED"]));
      break;
    case "VERIFY":
      c.push(and(eq(o.paymentMethod, "UPI"), eq(o.paymentStatus, "CLAIMED"), eq(o.status, "PENDING")));
      break;
    case "TO_SHIP":
      c.push(inArray(o.status, ["CONFIRMED", "PACKED"]));
      break;
  }
  const q = p.q?.trim();
  if (q) c.push(or(ilike(o.number, `%${q}%`), ilike(o.name, `%${q}%`), ilike(o.phone, `%${q}%`), ilike(o.pincode, `${q}%`)));
  if (p.from) c.push(gte(o.createdAt, new Date(p.from + "T00:00:00+05:30")));
  if (p.to) c.push(lte(o.createdAt, new Date(p.to + "T23:59:59+05:30")));
  return and(...c);
}
export const newestFirst = desc(o.createdAt);
