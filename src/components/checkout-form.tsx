"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveCart } from "./cart-view";
import { INDIAN_STATES, rupees } from "@/lib/money";

type S = { freeShippingThreshold: number; flatShippingFee: number; codEnabled: boolean; codFee: number; upiEnabled: boolean };

export function CheckoutForm({ settings }: { settings: S }) {
  const { lines, subtotal, ready, clear, hasProblems } = useLiveCart();
  const router = useRouter();
  const [method, setMethod] = useState<"UPI" | "COD">(settings.upiEnabled ? "UPI" : "COD");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingFee;
  const codFee = method === "COD" ? settings.codFee : 0;

  if (!ready) return <div className="container-x py-24" />;
  if (!lines.length)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <Link href="/products" className="btn-primary mt-6">Shop products</Link>
      </div>
    );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setErrors({});
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f, paymentMethod: method, items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })) }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : { error: "Network error. Please try again." };
    if (res?.ok && data.orderId) {
      clear();
      router.push(`/order/${data.orderId}`);
      return;
    }
    setErrors(data.fieldErrors ?? {});
    setError(data.error ?? "Something went wrong");
    setPending(false);
  }

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className={`input ${errors[name] ? "border-red-500" : ""}`} {...props} />
      {errors[name] && <p className="mt-1 text-xs text-red-700">{errors[name]![0]}</p>}
    </div>
  );

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl">Checkout</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="card space-y-4 p-6">
            <h2 className="text-2xl">Delivery details</h2>
            {field("name", "Full name", { required: true, autoComplete: "name" })}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("phone", "Mobile number", { required: true, inputMode: "tel", autoComplete: "tel", placeholder: "10-digit mobile" })}
              {field("email", "Email (optional)", { type: "email", autoComplete: "email" })}
            </div>
            {field("address1", "House / street", { required: true, autoComplete: "address-line1" })}
            {field("address2", "Area / landmark (optional)", { autoComplete: "address-line2" })}
            <div className="grid gap-4 sm:grid-cols-3">
              {field("city", "City", { required: true, autoComplete: "address-level2" })}
              <div>
                <label className="label" htmlFor="state">State</label>
                <select id="state" name="state" required defaultValue="Karnataka" className="input">
                  {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              {field("pincode", "PIN code", { required: true, inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
            </div>
            <div>
              <label className="label" htmlFor="note">Order note (optional)</label>
              <textarea id="note" name="note" rows={2} className="input" />
            </div>
          </section>

          <section className="card space-y-3 p-6">
            <h2 className="text-2xl">Payment</h2>
            {settings.upiEnabled && (
              <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${method === "UPI" ? "border-leaf bg-leaf/5" : "border-earth/15"}`}>
                <input type="radio" checked={method === "UPI"} onChange={() => setMethod("UPI")} className="mt-1 accent-leaf" />
                <span>
                  <strong>UPI (GPay, PhonePe, Paytm…)</strong>
                  <span className="block text-sm text-earth-light">Scan a QR or tap to pay after placing the order.</span>
                </span>
              </label>
            )}
            {settings.codEnabled && (
              <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${method === "COD" ? "border-leaf bg-leaf/5" : "border-earth/15"}`}>
                <input type="radio" checked={method === "COD"} onChange={() => setMethod("COD")} className="mt-1 accent-leaf" />
                <span>
                  <strong>Cash on Delivery</strong>
                  <span className="block text-sm text-earth-light">Pay when your parcel arrives{settings.codFee ? ` (+${rupees(settings.codFee)} COD charge)` : ""}.</span>
                </span>
              </label>
            )}
          </section>
        </div>

        <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-32">
          <h2 className="text-2xl">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {lines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-2">
                <span>{l.name} · {l.label} × {l.quantity}</span>
                <span className="shrink-0">{rupees(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-earth/10 pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{rupees(subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping ? rupees(shipping) : "Free"}</span></div>
            {codFee > 0 && <div className="flex justify-between"><span>COD charge</span><span>{rupees(codFee)}</span></div>}
          </div>
          <div className="flex justify-between border-t border-earth/10 pt-3 text-lg font-bold">
            <span>Total</span><span>{rupees(subtotal + shipping + codFee)}</span>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button className="btn-primary w-full" disabled={pending || hasProblems}>
            {pending ? "Placing order…" : "Place order"}
          </button>
          {hasProblems && <p className="text-sm text-red-700">Some items need attention. <Link href="/cart" className="underline">Review cart</Link></p>}
          <p className="text-center text-xs text-earth-light">Prices include all taxes.</p>
        </aside>
      </form>
    </div>
  );
}
