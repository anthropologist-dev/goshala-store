import { and, desc, eq, gte, inArray, lte, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { orders, orderItems, variants, products } = schema;
const LOST = ["CANCELLED", "RETURNED"] as const;

export async function getAnalytics(days: number) {
  const since = new Date(Date.now() - days * 86400_000);
  const inRange = gte(orders.createdAt, since);
  const counted = and(inRange, notInArray(orders.status, [...LOST]));

  const [totals] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}),0)::int`,
      orders: sql<number>`count(*)::int`,
      shipping: sql<number>`coalesce(sum(${orders.shippingFee}),0)::int`,
    })
    .from(orders)
    .where(counted);

  const [sold] = await db
    .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}),0)::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(counted);

  const [lost] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(inRange, inArray(orders.status, [...LOST])));

  // Daily revenue in IST
  const day = sql<string>`to_char((${orders.createdAt} at time zone 'Asia/Kolkata')::date, 'YYYY-MM-DD')`;
  const daily = await db
    .select({ day, revenue: sql<number>`sum(${orders.total})::int`, orders: sql<number>`count(*)::int` })
    .from(orders)
    .where(counted)
    .groupBy(day)
    .orderBy(day);
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series: { day: string; revenue: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() + 5.5 * 3600_000 - i * 86400_000).toISOString().slice(0, 10);
    series.push(byDay.get(d) ?? { day: d, revenue: 0, orders: 0 });
  }

  const top = await db
    .select({
      name: orderItems.productName,
      qty: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPrice})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(counted)
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.quantity} * ${orderItems.unitPrice})`))
    .limit(8);

  const payment = await db
    .select({ method: orders.paymentMethod, n: sql<number>`count(*)::int`, revenue: sql<number>`sum(${orders.total})::int` })
    .from(orders)
    .where(counted)
    .groupBy(orders.paymentMethod);

  const states = await db
    .select({ state: orders.state, n: sql<number>`count(*)::int`, revenue: sql<number>`sum(${orders.total})::int` })
    .from(orders)
    .where(counted)
    .groupBy(orders.state)
    .orderBy(desc(sql`sum(${orders.total})`))
    .limit(6);

  return { totals: { ...totals, items: sold.n }, cancelled: lost.n, series, top, payment, states };
}

/** Things needing attention right now, regardless of date range. */
export async function getActionItems() {
  const statusCounts = await db
    .select({ status: orders.status, n: sql<number>`count(*)::int` })
    .from(orders)
    .where(inArray(orders.status, ["PENDING", "CONFIRMED", "PACKED"]))
    .groupBy(orders.status);
  const [upi] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(eq(orders.paymentMethod, "UPI"), eq(orders.paymentStatus, "CLAIMED"), eq(orders.status, "PENDING")));
  const lowStock = await db
    .select({ id: variants.id, productId: products.id, name: products.name, label: variants.label, stock: variants.stock, lowStockAt: variants.lowStockAt })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .where(and(eq(products.active, true), eq(variants.active, true), lte(variants.stock, variants.lowStockAt)))
    .orderBy(variants.stock);
  return { statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s.n])) as Record<string, number>, upiToVerify: upi.n, lowStock };
}
