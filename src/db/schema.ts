// All money values are stored in paise (₹1 = 100) to avoid rounding errors.
// Prices are GST-inclusive; tax is split out on the invoice.
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const products = pgTable("products", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description").notNull().default(""),
  features: text("features").array().notNull().default([]),
  usage: text("usage").array().notNull().default([]),
  images: text("images").array().notNull().default([]),
  category: text("category").notNull().default("Pooja Essentials"),
  hsnCode: text("hsn_code"),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const variants = pgTable("variants", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sku: text("sku").notNull().unique(),
  price: integer("price").notNull(),
  mrp: integer("mrp"),
  weightGrams: integer("weight_grams").notNull().default(250),
  stock: integer("stock").notNull().default(0),
  lowStockAt: integer("low_stock_at").notNull().default(10),
  active: boolean("active").notNull().default(true),
});

export const stockReason = pgEnum("stock_reason", ["RESTOCK", "SALE", "CANCEL", "RETURN", "ADJUSTMENT", "DAMAGE"]);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: id(),
    variantId: text("variant_id").notNull().references(() => variants.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: stockReason("reason").notNull(),
    note: text("note"),
    orderId: text("order_id"),
    balance: integer("balance").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("stock_mv_variant_idx").on(t.variantId, t.createdAt)],
);

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;
export const orderStatus = pgEnum("order_status", ORDER_STATUSES);
export const paymentMethod = pgEnum("payment_method", ["UPI", "COD"]);
export const PAYMENT_STATUSES = ["UNPAID", "CLAIMED", "PAID", "REFUNDED"] as const;
export const paymentStatus = pgEnum("payment_status", PAYMENT_STATUSES);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    number: text("number").notNull().unique(),
    status: orderStatus("status").notNull().default("PENDING"),
    paymentMethod: paymentMethod("payment_method").notNull(),
    paymentStatus: paymentStatus("payment_status").notNull().default("UNPAID"),
    upiRef: text("upi_ref"),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address1: text("address1").notNull(),
    address2: text("address2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull(),
    codFee: integer("cod_fee").notNull().default(0),
    total: integer("total").notNull(),
    customerNote: text("customer_note"),
    adminNote: text("admin_note"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("orders_created_idx").on(t.createdAt), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable("order_items", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: text("variant_id").notNull().references(() => variants.id),
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label").notNull(),
  sku: text("sku").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  hsnCode: text("hsn_code"),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
});

export const SHIPMENT_STATUSES = ["PENDING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RETURNED"] as const;
export const shipmentStatus = pgEnum("shipment_status", SHIPMENT_STATUSES);

export const shipments = pgTable("shipments", {
  id: id(),
  orderId: text("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
  carrier: text("carrier").notNull().default("India Post"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  status: shipmentStatus("status").notNull().default("PENDING"),
  weightGrams: integer("weight_grams"),
  cost: integer("cost"),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
});

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    orderId: text("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
    number: text("number").notNull().unique(),
    fy: text("fy").notNull(),
    sequence: integer("sequence").notNull(),
    issuedAt: createdAt(),
  },
  (t) => [uniqueIndex("invoices_fy_seq").on(t.fy, t.sequence)],
);

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull().default("Sri Shivasadguru Gavyodyama"),
  address: text("address")
    .notNull()
    .default("No. 49, Sridhara Krupa, GNR Layout, Chikbanavara Post, Abbigere, Bengaluru 560090"),
  sellerState: text("seller_state").notNull().default("Karnataka"),
  gstin: text("gstin"),
  email: text("email").notNull().default("ssgkadatoka@gmail.com"),
  phone: text("phone").notNull().default("+91 94488 52888"),
  upiId: text("upi_id").notNull().default(""),
  upiName: text("upi_name").notNull().default("Sri Shivasadguru Gavyodyama"),
  freeShippingThreshold: integer("free_shipping_threshold").notNull().default(50000),
  flatShippingFee: integer("flat_shipping_fee").notNull().default(6000),
  codEnabled: boolean("cod_enabled").notNull().default(true),
  codFee: integer("cod_fee").notNull().default(0),
  invoicePrefix: text("invoice_prefix").notNull().default("SSG"),
  defaultCarrier: text("default_carrier").notNull().default("India Post"),
  trackingUrlTemplate: text("tracking_url_template")
    .notNull()
    .default("https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"),
});

export const inquiries = pgTable("inquiries", {
  id: id(),
  email: text("email").notNull(),
  message: text("message"),
  handled: boolean("handled").notNull().default(false),
  createdAt: createdAt(),
});

export const adminUsers = pgTable("admin_users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const productsRelations = relations(products, ({ many }) => ({ variants: many(variants) }));
export const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, { fields: [variants.productId], references: [products.id] }),
  movements: many(stockMovements),
}));
export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  variant: one(variants, { fields: [stockMovements.variantId], references: [variants.id] }),
}));
export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  shipment: one(shipments),
  invoice: one(invoices),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(variants, { fields: [orderItems.variantId], references: [variants.id] }),
}));
export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, { fields: [shipments.orderId], references: [orders.id] }),
}));
export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, { fields: [invoices.orderId], references: [orders.id] }),
}));

export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
