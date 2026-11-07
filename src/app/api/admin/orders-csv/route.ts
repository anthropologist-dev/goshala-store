import { db } from "@/db";
import { getAdmin } from "@/lib/auth";
import { newestFirst, orderWhere } from "@/lib/order-filters";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const rows = await db.query.orders.findMany({ where: orderWhere(sp), orderBy: newestFirst, with: { items: true, shipment: true, invoice: true } });
  const head = ["Order", "Date", "Status", "Payment", "Payment status", "UPI ref", "Invoice", "Name", "Phone", "Email", "Address", "City", "State", "PIN", "Items", "Subtotal", "Shipping", "COD fee", "Total", "Carrier", "Tracking"];
  const lines = rows.map((o) =>
    [
      o.number,
      o.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      o.status,
      o.paymentMethod,
      o.paymentStatus,
      o.upiRef,
      o.invoice?.number,
      o.name,
      o.phone,
      o.email,
      [o.address1, o.address2].filter(Boolean).join(", "),
      o.city,
      o.state,
      o.pincode,
      o.items.map((i) => `${i.sku} x${i.quantity}`).join("; "),
      o.subtotal / 100,
      o.shippingFee / 100,
      o.codFee / 100,
      o.total / 100,
      o.shipment?.carrier,
      o.shipment?.trackingNumber,
    ]
      .map(cell)
      .join(","),
  );
  return new Response("﻿" + [head.join(","), ...lines].join("\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
