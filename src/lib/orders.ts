import { and, eq, inArray, max, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema, type Tx } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { getSettings, shippingFor } from "./settings";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
  address1: z.string().trim().min(5, "Enter your address").max(200),
  address2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Choose your state"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  paymentMethod: z.enum(["UPI", "COD"]),
  note: z.string().trim().max(500).optional(),
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(50) }))
    .min(1, "Your cart is empty"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export class OrderError extends Error {}

function orderNumber() {
  const d = new Date(Date.now() + 5.5 * 3600_000); // IST
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SSG${ymd}${rand}`;
}

async function recordMovement(
  tx: Tx,
  variantId: string,
  delta: number,
  reason: (typeof schema.stockReason.enumValues)[number],
  note?: string | null,
  orderId?: string,
) {
  const [v] = await tx
    .update(schema.variants)
    .set({ stock: sql`${schema.variants.stock} + ${delta}` })
    .where(eq(schema.variants.id, variantId))
    .returning({ stock: schema.variants.stock });
  if (!v) throw new OrderError("Variant not found");
  await tx.insert(schema.stockMovements).values({ variantId, delta, reason, note, orderId, balance: v.stock });
  return v.stock;
}

/** Validates prices and stock on the server, reserves stock and creates the order atomically. */
export async function createOrder(input: CheckoutInput) {
  const settings = await getSettings();
  if (input.paymentMethod === "COD" && !settings.codEnabled) throw new OrderError("Cash on Delivery is not available right now");
  if (input.paymentMethod === "UPI" && !settings.upiId) throw new OrderError("UPI payment is not set up yet. Please choose Cash on Delivery.");

  // merge duplicate lines
  const qty = new Map<string, number>();
  for (const i of input.items) qty.set(i.variantId, (qty.get(i.variantId) ?? 0) + i.quantity);

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ v: schema.variants, p: schema.products })
      .from(schema.variants)
      .innerJoin(schema.products, eq(schema.variants.productId, schema.products.id))
      .where(inArray(schema.variants.id, [...qty.keys()]))
      .for("update", { of: schema.variants });

    if (rows.length !== qty.size) throw new OrderError("Some items in your cart are no longer available");
    let subtotal = 0;
    for (const { v, p } of rows) {
      const q = qty.get(v.id)!;
      if (!v.active || !p.active) throw new OrderError(`${p.name} is no longer available`);
      if (v.stock < q) throw new OrderError(v.stock > 0 ? `Only ${v.stock} left of ${p.name} (${v.label})` : `${p.name} (${v.label}) is out of stock`);
      subtotal += v.price * q;
    }
    const shippingFee = shippingFor(subtotal, settings);
    const codFee = input.paymentMethod === "COD" ? settings.codFee : 0;

    const [order] = await tx
      .insert(schema.orders)
      .values({
        number: orderNumber(),
        paymentMethod: input.paymentMethod,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        address1: input.address1,
        address2: input.address2 || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        subtotal,
        shippingFee,
        codFee,
        total: subtotal + shippingFee + codFee,
        customerNote: input.note || null,
      })
      .returning();

    for (const { v, p } of rows) {
      const q = qty.get(v.id)!;
      await tx.insert(schema.orderItems).values({
        orderId: order.id,
        variantId: v.id,
        productName: p.name,
        variantLabel: v.label,
        sku: v.sku,
        unitPrice: v.price,
        quantity: q,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
      });
      await recordMovement(tx, v.id, -q, "SALE", `Order ${order.number}`, order.id);
    }
    await tx.insert(schema.shipments).values({ orderId: order.id, carrier: settings.defaultCarrier });
    return order;
  });
}

function financialYear(d: Date) {
  const ist = new Date(d.getTime() + 5.5 * 3600_000);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

export async function ensureInvoice(tx: Tx, orderId: string) {
  const existing = await tx.query.invoices.findFirst({ where: eq(schema.invoices.orderId, orderId) });
  if (existing) return existing;
  const s = await tx.query.settings.findFirst();
  const fy = financialYear(new Date());
  // serialise invoice numbering so numbers stay gap-free and sequential
  await tx.execute(sql`select pg_advisory_xact_lock(424242)`);
  const [{ m }] = await tx.select({ m: max(schema.invoices.sequence) }).from(schema.invoices).where(eq(schema.invoices.fy, fy));
  const sequence = (m ?? 0) + 1;
  const [inv] = await tx
    .insert(schema.invoices)
    .values({ orderId, fy, sequence, number: `${s?.invoicePrefix ?? "SSG"}/${fy}/${String(sequence).padStart(4, "0")}` })
    .returning();
  return inv;
}

const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

export function nextStatuses(current: OrderStatus): OrderStatus[] {
  if (current === "CANCELLED" || current === "RETURNED") return [];
  const i = FLOW.indexOf(current);
  const out: OrderStatus[] = FLOW.slice(i + 1, i + 2);
  if (current === "DELIVERED" || current === "SHIPPED") out.push("RETURNED");
  if (["PENDING", "CONFIRMED", "PACKED"].includes(current)) out.push("CANCELLED");
  return out;
}

export async function changeStatus(orderId: string, to: OrderStatus, note?: string) {
  return db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: eq(schema.orders.id, orderId), with: { items: true } });
    if (!order) throw new OrderError("Order not found");
    if (!nextStatuses(order.status).includes(to)) throw new OrderError(`Can't move an order from ${order.status} to ${to}`);

    const patch: Partial<typeof schema.orders.$inferInsert> = { status: to };
    if (to === "CANCELLED" || to === "RETURNED") {
      for (const it of order.items)
        await recordMovement(tx, it.variantId, it.quantity, to === "CANCELLED" ? "CANCEL" : "RETURN", `Order ${order.number}${note ? `: ${note}` : ""}`, order.id);
      if (order.paymentStatus === "PAID") patch.paymentStatus = "REFUNDED";
      if (to === "RETURNED") await tx.update(schema.shipments).set({ status: "RETURNED" }).where(eq(schema.shipments.orderId, orderId));
    }
    if (to === "CONFIRMED") await ensureInvoice(tx, orderId);
    if (to === "SHIPPED")
      await tx.update(schema.shipments).set({ status: "SHIPPED", shippedAt: new Date() }).where(eq(schema.shipments.orderId, orderId));
    if (to === "DELIVERED") {
      await tx.update(schema.shipments).set({ status: "DELIVERED", deliveredAt: new Date() }).where(eq(schema.shipments.orderId, orderId));
      if (order.paymentMethod === "COD") patch.paymentStatus = "PAID";
    }
    if (note) patch.adminNote = [order.adminNote, note].filter(Boolean).join("\n");
    await tx.update(schema.orders).set(patch).where(eq(schema.orders.id, orderId));
  });
}

export async function adjustStock(variantId: string, delta: number, reason: "RESTOCK" | "ADJUSTMENT" | "DAMAGE", note?: string) {
  if (!Number.isInteger(delta) || delta === 0) throw new OrderError("Enter a non-zero whole number");
  return db.transaction(async (tx) => {
    const v = await tx.query.variants.findFirst({ where: eq(schema.variants.id, variantId) });
    if (!v) throw new OrderError("Variant not found");
    if (v.stock + delta < 0) throw new OrderError(`Stock can't go below zero (currently ${v.stock})`);
    return recordMovement(tx, variantId, delta, reason, note);
  });
}

export async function findOrderForCustomer(number: string, phone: string) {
  const clean = phone.replace(/\D/g, "").slice(-10);
  return db.query.orders.findFirst({
    where: and(eq(schema.orders.number, number.trim().toUpperCase()), eq(schema.orders.phone, clean)),
    with: { items: true, shipment: true },
  });
}

/** Splits GST-inclusive line totals into taxable value and tax. */
export function gstBreakup(
  items: { unitPrice: number; quantity: number; gstRate: string }[],
  intraState: boolean,
) {
  const lines = items.map((i) => {
    const gross = i.unitPrice * i.quantity;
    const rate = Number(i.gstRate);
    const taxable = Math.round((gross * 100) / (100 + rate));
    const tax = gross - taxable;
    const half = Math.round(tax / 2);
    return { gross, rate, taxable, tax, cgst: intraState ? half : 0, sgst: intraState ? tax - half : 0, igst: intraState ? 0 : tax };
  });
  const sum = (k: keyof (typeof lines)[number]) => lines.reduce((a, l) => a + (l[k] as number), 0);
  return { lines, taxable: sum("taxable"), cgst: sum("cgst"), sgst: sum("sgst"), igst: sum("igst"), tax: sum("tax") };
}
