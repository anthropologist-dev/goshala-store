import { PageHero } from "@/components/page-hero";
import { getSettings } from "@/lib/settings";
import { rupees } from "@/lib/money";
export const metadata = { title: "Shipping and Refund Policy" };

export default async function ShippingRefund() {
  const s = await getSettings();
  return (
    <>
      <PageHero title="Shipping and Refund Policy" />
      <article className="container-x prose-store mt-12 max-w-3xl">
        <h2>Shipping</h2>
        <ul>
          <li>Free shipping on orders of {rupees(s.freeShippingThreshold)} and above; otherwise a flat {rupees(s.flatShippingFee)}.</li>
          <li>Orders are handed to the courier or India Post within 0–7 days of order and payment, or by the date agreed at confirmation.</li>
          <li>Domestic orders ship via registered couriers and/or Speed Post; international orders via registered international couriers and/or international Speed Post.</li>
          <li>Delivery times depend on the courier or post office, and we can&apos;t be held responsible for their delays. You&apos;ll get a tracking number once your order ships.</li>
        </ul>
        <h2>Returns and refunds</h2>
        <ul>
          <li>Return shipping is at the customer&apos;s cost and risk. Please use an insured, trackable service; we can&apos;t be responsible for parcels lost or damaged in return transit.</li>
          <li>Refunds are issued once we receive the goods or proof of return delivery.</li>
          <li>Gift orders shipped to the recipient are refunded to the recipient as gift credit.</li>
        </ul>
        <p><strong>Return address:</strong> {s.address}</p>
        <p><strong>Helpdesk:</strong> {s.phone} · <a className="underline" href={`mailto:${s.email}`}>{s.email}</a></p>
      </article>
    </>
  );
}
