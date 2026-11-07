import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { SHIPMENT_STATUSES } from "@/db/schema";
import { nextStatuses } from "@/lib/orders";
import { rupees } from "@/lib/money";
import { Badge } from "@/components/admin/badges";
import { ActionForm } from "@/components/admin/action-form";
import { issueInvoice, markPaid, saveOrderNote, saveShipment, setOrderStatus } from "../../../actions";

const ACTION_LABEL: Record<string, string> = {
  CONFIRMED: "Confirm order",
  PACKED: "Mark packed",
  SHIPPED: "Mark shipped",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order",
  RETURNED: "Mark returned",
};

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await db.query.orders.findFirst({ where: eq(schema.orders.id, id), with: { items: true, shipment: true, invoice: true } });
  if (!o) notFound();
  const next = nextStatuses(o.status);
  const sh = o.shipment;
  const weight = o.items.reduce((a, i) => a + i.quantity, 0);
  const waText = encodeURIComponent(
    `Namaskara ${o.name.split(" ")[0]}, your order ${o.number} from Sri Shivasadguru Goshala` +
      (sh?.trackingNumber ? ` has been shipped via ${sh.carrier}. Tracking no: ${sh.trackingNumber}.` : ` is ${o.status.toLowerCase()}.`) +
      " 🙏",
  );

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" className="text-sm text-stone-500 hover:underline">← Orders</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">{o.number}</h1>
          <p className="text-sm text-stone-500">{o.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })}</p>
        </div>
        <div className="flex gap-2"><Badge value={o.status} /><Badge value={o.paymentStatus} /></div>
      </div>

      {/* Primary actions */}
      <section className="card space-y-4 p-5">
        {o.paymentMethod === "UPI" && (o.paymentStatus === "UNPAID" || o.paymentStatus === "CLAIMED") && !["CANCELLED", "RETURNED"].includes(o.status) && (
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm">
              {o.paymentStatus === "CLAIMED" ? (
                <>Customer says they paid. UTR: <strong className="font-mono">{o.upiRef}</strong>. Check it in your bank/UPI app for {rupees(o.total)}.</>
              ) : (
                <>Waiting for UPI payment of {rupees(o.total)}.</>
              )}
            </p>
            <ActionForm action={markPaid} submit="Payment received" className="mt-3 flex flex-wrap items-center gap-2" submitClass="btn-primary px-4 py-2">
              <input type="hidden" name="orderId" value={o.id} />
              <input name="upiRef" defaultValue={o.upiRef ?? ""} placeholder="UTR (optional)" className="input w-48" />
            </ActionForm>
          </div>
        )}
        {next.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <ActionForm key={s} action={setOrderStatus} submit={ACTION_LABEL[s]} submitClass={s === "CANCELLED" || s === "RETURNED" ? "btn-outline border-red-300 px-4 py-2 text-red-700 hover:bg-red-700 hover:text-white" : "btn-primary px-4 py-2"}>
                <input type="hidden" name="orderId" value={o.id} />
                <input type="hidden" name="status" value={s} />
              </ActionForm>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500">This order is closed.</p>
        )}
        {next.includes("CANCELLED") && <p className="text-xs text-stone-500">Cancelling puts the items back into stock.</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Items</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2 py-2">
                <span>{i.productName} · {i.variantLabel} <span className="text-stone-400">({i.sku})</span> × {i.quantity}</span>
                <span>{rupees(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1 border-t border-stone-200 pt-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{rupees(o.subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{rupees(o.shippingFee)}</span></div>
            {o.codFee > 0 && <div className="flex justify-between"><span>COD charge</span><span>{rupees(o.codFee)}</span></div>}
            <div className="flex justify-between font-bold"><span>Total ({o.paymentMethod})</span><span>{rupees(o.total)}</span></div>
          </div>
          {o.customerNote && <p className="mt-3 rounded-lg bg-stone-50 p-3 text-sm"><strong>Customer note:</strong> {o.customerNote}</p>}
        </section>

        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Customer</h2>
          <p className="font-semibold">{o.name}</p>
          <p>
            <a href={`tel:+91${o.phone}`} className="underline">+91 {o.phone}</a>
            {o.email && <> · <a href={`mailto:${o.email}`} className="underline">{o.email}</a></>}
          </p>
          <p className="mt-2 whitespace-pre-line">{[o.address1, o.address2, `${o.city}, ${o.state} ${o.pincode}`].filter(Boolean).join("\n")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`https://wa.me/91${o.phone}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2">WhatsApp customer</a>
            {o.invoice ? (
              <a href={`/api/admin/invoice/${o.id}`} target="_blank" className="btn-outline px-4 py-2">Invoice {o.invoice.number}</a>
            ) : (
              !["CANCELLED"].includes(o.status) && (
                <ActionForm action={issueInvoice} submit="Issue invoice" submitClass="btn-outline px-4 py-2">
                  <input type="hidden" name="orderId" value={o.id} />
                </ActionForm>
              )
            )}
            <a href={`/api/admin/invoice/${o.id}?label=1`} target="_blank" className="btn-outline px-4 py-2">Shipping label</a>
          </div>
        </section>
      </div>

      {sh && (
        <section className="card p-5">
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Shipment</h2>
          <ActionForm action={saveShipment} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" submit="Save shipment" submitClass="btn-primary sm:col-span-2 lg:col-span-1 lg:self-end">
            <input type="hidden" name="orderId" value={o.id} />
            <div><label className="label">Carrier</label><input name="carrier" defaultValue={sh.carrier} className="input" /></div>
            <div><label className="label">Tracking number</label><input name="trackingNumber" defaultValue={sh.trackingNumber ?? ""} className="input" /></div>
            <div><label className="label">Tracking link (optional)</label><input name="trackingUrl" defaultValue={sh.trackingUrl ?? ""} className="input" placeholder="https://…" /></div>
            <div>
              <label className="label">Shipment status</label>
              <select name="status" defaultValue={sh.status} className="input">
                {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}
              </select>
            </div>
            <div><label className="label">Parcel weight (g)</label><input name="weightGrams" type="number" defaultValue={sh.weightGrams ?? ""} placeholder={`~${weight} items`} className="input" /></div>
            <div><label className="label">Shipping cost paid (₹)</label><input name="cost" type="number" step="0.01" defaultValue={sh.cost != null ? sh.cost / 100 : ""} className="input" /></div>
          </ActionForm>
          {sh.shippedAt && <p className="mt-3 text-xs text-stone-500">Shipped {sh.shippedAt.toLocaleDateString("en-IN")}{sh.deliveredAt && ` · delivered ${sh.deliveredAt.toLocaleDateString("en-IN")}`}</p>}
        </section>
      )}

      <section className="card p-5">
        <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Internal notes</h2>
        <ActionForm action={saveOrderNote} className="space-y-2" submit="Save note" submitClass="btn-outline px-4 py-2">
          <input type="hidden" name="orderId" value={o.id} />
          <textarea name="adminNote" defaultValue={o.adminNote ?? ""} rows={3} className="input" />
        </ActionForm>
      </section>
    </div>
  );
}
