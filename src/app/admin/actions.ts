"use server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { ORDER_STATUSES, SHIPMENT_STATUSES } from "@/db/schema";
import { createSession, requireAdmin, SESSION_COOKIE } from "@/lib/auth";
import { adjustStock, changeStatus, ensureInvoice, OrderError } from "@/lib/orders";
import { toPaise } from "@/lib/money";

export type ActionState = { ok: boolean; message: string } | null;
const fail = (e: unknown): ActionState => ({
  ok: false,
  message: e instanceof OrderError || e instanceof z.ZodError ? (e instanceof z.ZodError ? e.issues[0].message : e.message) : "Something went wrong",
});

// ---------- auth ----------
const attempts = new Map<string, { n: number; at: number }>();

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const a = attempts.get(email);
  if (a && a.n >= 5 && Date.now() - a.at < 15 * 60_000) return { ok: false, message: "Too many attempts. Try again in 15 minutes." };
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    attempts.set(email, { n: (a?.n ?? 0) + 1, at: Date.now() });
    return { ok: false, message: "Wrong email or password" };
  }
  attempts.delete(email);
  await createSession(user.email);
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function changePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 10) return { ok: false, message: "Use at least 10 characters" };
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, admin.email) });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { ok: false, message: "Current password is wrong" };
  await db.update(schema.adminUsers).set({ passwordHash: await bcrypt.hash(next, 12) }).where(eq(schema.adminUsers.id, user.id));
  return { ok: true, message: "Password updated" };
}

// ---------- orders ----------
export async function setOrderStatus(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    const id = z.string().parse(form.get("orderId"));
    const to = z.enum(ORDER_STATUSES).parse(form.get("status"));
    await changeStatus(id, to, String(form.get("note") ?? "").trim() || undefined);
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    return { ok: true, message: `Marked ${to.toLowerCase()}` };
  } catch (e) {
    return fail(e);
  }
}

export async function markPaid(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(form.get("orderId"));
  const ref = String(form.get("upiRef") ?? "").trim();
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, id) });
  if (!order) return { ok: false, message: "Order not found" };
  await db.transaction(async (tx) => {
    await tx.update(schema.orders).set({ paymentStatus: "PAID", upiRef: ref || order.upiRef }).where(eq(schema.orders.id, id));
  });
  // A verified UPI payment confirms a pending order (this also issues the invoice)
  if (order.status === "PENDING") await changeStatus(id, "CONFIRMED", "Payment verified");
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Payment marked as received" };
}

export async function saveShipment(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    const data = z
      .object({
        orderId: z.string(),
        carrier: z.string().trim().min(1),
        trackingNumber: z.string().trim().optional(),
        trackingUrl: z.union([z.literal(""), z.string().url("Tracking link must be a full URL")]).optional(),
        status: z.enum(SHIPMENT_STATUSES),
        weightGrams: z.coerce.number().int().min(0).optional(),
        cost: z.string().optional(),
      })
      .parse(Object.fromEntries(form));
    const settings = await db.query.settings.findFirst();
    await db
      .update(schema.shipments)
      .set({
        carrier: data.carrier,
        trackingNumber: data.trackingNumber || null,
        trackingUrl: data.trackingUrl || (data.trackingNumber && settings?.trackingUrlTemplate ? settings.trackingUrlTemplate.replace("{tracking}", data.trackingNumber) : null),
        status: data.status,
        weightGrams: data.weightGrams || null,
        cost: data.cost ? toPaise(data.cost) : null,
      })
      .where(eq(schema.shipments.orderId, data.orderId));
    revalidatePath(`/admin/orders/${data.orderId}`);
    return { ok: true, message: "Shipment saved" };
  } catch (e) {
    return fail(e);
  }
}

export async function saveOrderNote(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(form.get("orderId"));
  await db.update(schema.orders).set({ adminNote: String(form.get("adminNote") ?? "") }).where(eq(schema.orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Note saved" };
}

export async function issueInvoice(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(form.get("orderId"));
  await db.transaction((tx) => ensureInvoice(tx, id));
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Invoice issued" };
}

// ---------- products & inventory ----------
const lines = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can only have lowercase letters, numbers and dashes"),
  tagline: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1, "Category is required"),
  hsnCode: z.string().trim().optional(),
  gstRate: z.coerce.number().min(0).max(28),
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveProduct(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  try {
    const p = productSchema.parse(Object.fromEntries(form));
    const values = {
      ...p,
      tagline: p.tagline || null,
      description: p.description ?? "",
      hsnCode: p.hsnCode || null,
      gstRate: String(p.gstRate),
      features: lines(form.get("features")),
      usage: lines(form.get("usage")),
      images: lines(form.get("images")),
      active: form.get("active") === "on",
      featured: form.get("featured") === "on",
    };
    const clash = await db.query.products.findFirst({ where: eq(schema.products.slug, p.slug) });
    if (clash && clash.id !== id) return { ok: false, message: "Another product already uses that slug" };
    if (id) {
      await db.update(schema.products).set(values).where(eq(schema.products.id, id));
    } else {
      const [row] = await db.insert(schema.products).values(values).returning();
      redirect(`/admin/products/${row.id}?created=1`);
    }
    revalidatePath("/", "layout");
    return { ok: true, message: "Product saved" };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // let redirect() through
    return fail(e);
  }
}

const variantSchema = z.object({
  productId: z.string(),
  label: z.string().trim().min(1, "Pack label is required"),
  sku: z.string().trim().toUpperCase().min(2, "SKU is required"),
  price: z.string().min(1, "Price is required"),
  mrp: z.string().optional(),
  weightGrams: z.coerce.number().int().min(1),
  lowStockAt: z.coerce.number().int().min(0),
});

export async function saveVariant(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  try {
    const v = variantSchema.parse(Object.fromEntries(form));
    const price = toPaise(v.price);
    if (!(price > 0)) return { ok: false, message: "Price must be more than zero" };
    const values = {
      productId: v.productId,
      label: v.label,
      sku: v.sku,
      price,
      mrp: v.mrp ? toPaise(v.mrp) : null,
      weightGrams: v.weightGrams,
      lowStockAt: v.lowStockAt,
      active: form.get("active") === "on",
    };
    const clash = await db.query.variants.findFirst({ where: eq(schema.variants.sku, v.sku) });
    if (clash && clash.id !== id) return { ok: false, message: "SKU already in use" };
    if (id) await db.update(schema.variants).set(values).where(eq(schema.variants.id, id));
    else {
      const [row] = await db.insert(schema.variants).values({ ...values, stock: 0 }).returning();
      const opening = Number(form.get("openingStock") ?? 0);
      if (opening > 0) await adjustStock(row.id, opening, "RESTOCK", "Opening stock");
    }
    revalidatePath(`/admin/products/${v.productId}`);
    revalidatePath("/", "layout");
    return { ok: true, message: id ? "Pack saved" : "Pack added" };
  } catch (e) {
    return fail(e);
  }
}

export async function stockAdjust(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    const variantId = z.string().parse(form.get("variantId"));
    const reason = z.enum(["RESTOCK", "ADJUSTMENT", "DAMAGE"]).parse(form.get("reason"));
    let delta = z.coerce.number().int().parse(form.get("delta"));
    if (reason === "RESTOCK") delta = Math.abs(delta);
    if (reason === "DAMAGE") delta = -Math.abs(delta);
    const bal = await adjustStock(variantId, delta, reason, String(form.get("note") ?? "").trim() || undefined);
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products", "layout");
    return { ok: true, message: `Stock is now ${bal}` };
  } catch (e) {
    return fail(e);
  }
}

// ---------- settings & inquiries ----------
export async function saveSettings(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  try {
    const s = z
      .object({
        businessName: z.string().trim().min(2),
        address: z.string().trim().min(5),
        sellerState: z.string().trim().min(2),
        gstin: z.string().trim().toUpperCase().regex(/^$|^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, "GSTIN format looks wrong").optional(),
        email: z.string().trim().email(),
        phone: z.string().trim().min(6),
        upiId: z.string().trim().regex(/^$|^[\w.\-]{2,}@[a-zA-Z]{2,}$/, "UPI ID should look like name@bank"),
        upiName: z.string().trim().min(2),
        freeShippingThreshold: z.string(),
        flatShippingFee: z.string(),
        codFee: z.string(),
        invoicePrefix: z.string().trim().min(1).max(10),
        defaultCarrier: z.string().trim().min(1),
        trackingUrlTemplate: z.string().trim(),
      })
      .parse(Object.fromEntries(form));
    await db
      .update(schema.settings)
      .set({
        ...s,
        gstin: s.gstin || null,
        freeShippingThreshold: toPaise(s.freeShippingThreshold || 0),
        flatShippingFee: toPaise(s.flatShippingFee || 0),
        codFee: toPaise(s.codFee || 0),
        codEnabled: form.get("codEnabled") === "on",
      })
      .where(eq(schema.settings.id, 1));
    revalidatePath("/", "layout");
    return { ok: true, message: "Settings saved" };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleInquiry(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const handled = form.get("handled") === "true";
  await db.update(schema.inquiries).set({ handled: !handled }).where(eq(schema.inquiries.id, id));
  revalidatePath("/admin/inquiries");
}
