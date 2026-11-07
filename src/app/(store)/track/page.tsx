import Link from "next/link";
import { findOrderForCustomer } from "@/lib/orders";
import { rupees } from "@/lib/money";
import { OrderProgress } from "@/components/order-status";

export const metadata = { title: "Track your order" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string }> }) {
  const { order: number, phone } = await searchParams;
  const order = number && phone ? await findOrderForCustomer(number, phone) : null;
  return (
    <div className="container-x max-w-xl py-12">
      <h1 className="text-4xl">Track your order</h1>
      <form className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="order">Order number</label>
          <input id="order" name="order" defaultValue={number} required className="input" placeholder="SSG2611071234" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Mobile number used at checkout</label>
          <input id="phone" name="phone" defaultValue={phone} required inputMode="tel" className="input" />
        </div>
        <button className="btn-primary w-full">Find my order</button>
      </form>
      {number && phone && !order && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t find an order with those details.</p>}
      {order && (
        <section className="card mt-6 space-y-4 p-6">
          <div className="flex justify-between">
            <strong>{order.number}</strong>
            <span>{rupees(order.total)}</span>
          </div>
          <OrderProgress status={order.status} />
          {order.shipment?.trackingNumber && (
            <p className="text-sm">
              {order.shipment.carrier} · <strong>{order.shipment.trackingNumber}</strong>
              {order.shipment.trackingUrl && <> · <a className="underline" href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer">Track parcel</a></>}
            </p>
          )}
          <Link href={`/order/${order.id}`} className="text-sm font-bold text-saffron">View full order →</Link>
        </section>
      )}
    </div>
  );
}
