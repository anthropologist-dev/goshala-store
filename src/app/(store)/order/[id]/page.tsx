import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { rupees } from "@/lib/money";
import { upiLink, upiQr } from "@/lib/upi";
import { OrderProgress } from "@/components/order-status";
import { UpiRefForm } from "@/components/upi-ref-form";

export const metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, id), with: { items: true, shipment: true } });
  if (!order) notFound();
  const s = await getSettings();
  const needsUpi = order.paymentMethod === "UPI" && order.paymentStatus === "UNPAID" && order.status === "PENDING" && s.upiId;
  const link = needsUpi ? upiLink({ upiId: s.upiId, name: s.upiName, amount: order.total, orderNumber: order.number }) : null;
  const qr = link ? await upiQr(link) : null;

  return (
    <div className="container-x max-w-3xl py-10">
      <p className="eyebrow mb-2">Order {order.number}</p>
      <h1 className="text-4xl">Thank you, {order.name.split(" ")[0]}! 🙏</h1>
      <p className="mt-2 text-earth-light">
        Save your order number <strong>{order.number}</strong>. You can track it anytime from the{" "}
        <Link href="/track" className="underline">Track order</Link> page with your mobile number.
      </p>

      <div className="mt-8"><OrderProgress status={order.status} /></div>

      {needsUpi && qr && link && (
        <section className="card mt-8 p-6 text-center">
          <h2 className="text-2xl">Complete your payment of {rupees(order.total)}</h2>
          <p className="mt-1 text-sm text-earth-light">Scan with any UPI app, or tap the button on your phone.</p>
          <img src={qr} alt="UPI payment QR code" className="mx-auto mt-4 h-60 w-60 rounded-xl" />
          <p className="mt-2 text-sm">UPI ID: <strong>{s.upiId}</strong></p>
          <a href={link} className="btn-accent mt-4 sm:hidden">Pay with UPI app</a>
          <div className="mx-auto max-w-sm text-left"><UpiRefForm orderId={order.id} /></div>
        </section>
      )}
      {order.paymentMethod === "UPI" && order.paymentStatus === "CLAIMED" && (
        <p className="mt-8 rounded-xl bg-saffron/10 p-4 text-sm">We received your payment reference <strong>{order.upiRef}</strong> and will confirm it shortly.</p>
      )}
      {order.paymentMethod === "COD" && order.status === "PENDING" && (
        <p className="mt-8 rounded-xl bg-leaf/10 p-4 text-sm">Cash on Delivery: please keep {rupees(order.total)} ready when your parcel arrives.</p>
      )}
      {order.shipment?.trackingNumber && (
        <p className="mt-8 rounded-xl bg-leaf/10 p-4 text-sm">
          Shipped via {order.shipment.carrier}. Tracking number <strong>{order.shipment.trackingNumber}</strong>
          {order.shipment.trackingUrl && <> · <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline">Track parcel</a></>}
        </p>
      )}

      <section className="card mt-8 p-6">
        <h2 className="mb-4 text-2xl">Summary</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span>{i.productName} · {i.variantLabel} × {i.quantity}</span><span>{rupees(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-earth/10 pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{rupees(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{order.shippingFee ? rupees(order.shippingFee) : "Free"}</span></div>
          {order.codFee > 0 && <div className="flex justify-between"><span>COD charge</span><span>{rupees(order.codFee)}</span></div>}
          <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{rupees(order.total)}</span></div>
        </div>
        <div className="mt-5 border-t border-earth/10 pt-4 text-sm">
          <p className="label">Delivering to</p>
          <p>{order.name} · {order.phone}</p>
          <p>{[order.address1, order.address2, order.city, order.state, order.pincode].filter(Boolean).join(", ")}</p>
        </div>
      </section>
      <p className="mt-6 text-center text-sm text-earth-light">
        Questions? WhatsApp or call {s.phone}
      </p>
    </div>
  );
}
