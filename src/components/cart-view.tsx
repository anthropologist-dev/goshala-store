"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { rupees } from "@/lib/money";

type Live = { id: string; price: number; stock: number; available: boolean };

export function useLiveCart() {
  const cart = useCart();
  const [live, setLive] = useState<Record<string, Live>>({});
  const ids = cart.lines.map((l) => l.variantId).join(",");
  useEffect(() => {
    if (!cart.ready || !ids) return;
    fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: ids.split(",") }) })
      .then((r) => r.json())
      .then((d: { variants: Live[] }) => setLive(Object.fromEntries(d.variants.map((v) => [v.id, v]))))
      .catch(() => {});
  }, [ids, cart.ready]);
  const lines = cart.lines.map((l) => {
    const lv = live[l.variantId];
    const price = lv?.price ?? l.price;
    const problem = !lv ? null : !lv.available ? "No longer available" : lv.stock <= 0 ? "Out of stock" : lv.stock < l.quantity ? `Only ${lv.stock} available` : null;
    return { ...l, price, problem, maxQty: lv ? Math.min(50, lv.stock) : 50 };
  });
  const subtotal = lines.reduce((a, l) => a + l.price * l.quantity, 0);
  return { ...cart, lines, subtotal, hasProblems: lines.some((l) => l.problem) };
}

export function CartView({ freeShippingThreshold, flatShippingFee }: { freeShippingThreshold: number; flatShippingFee: number }) {
  const { lines, subtotal, setQty, remove, ready, hasProblems } = useLiveCart();
  const shipping = subtotal >= freeShippingThreshold ? 0 : flatShippingFee;
  const toFree = freeShippingThreshold - subtotal;

  if (!ready) return <div className="container-x py-24" />;
  if (!lines.length)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-earth-light">Discover our pure, cow-based products.</p>
        <Link href="/products" className="btn-primary mt-6">Shop products</Link>
      </div>
    );

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {lines.map((l) => (
            <li key={l.variantId} className="card flex gap-4 p-4">
              <Link href={`/products/${l.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                {l.image && <img src={l.image} alt={l.name} className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link href={`/products/${l.slug}`} className="font-serif text-xl font-semibold text-leaf-dark">{l.name}</Link>
                    <p className="text-sm text-earth-light">{l.label} · {rupees(l.price)}</p>
                  </div>
                  <p className="font-bold">{rupees(l.price * l.quantity)}</p>
                </div>
                {l.problem && <p className="mt-1 text-sm font-semibold text-red-700">{l.problem}</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-earth/20">
                    <button className="px-3 py-1" onClick={() => setQty(l.variantId, l.quantity - 1)} aria-label="Decrease">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{l.quantity}</span>
                    <button className="px-3 py-1 disabled:opacity-30" disabled={l.quantity >= l.maxQty} onClick={() => setQty(l.variantId, l.quantity + 1)} aria-label="Increase">+</button>
                  </div>
                  <button className="text-sm text-earth-light underline" onClick={() => remove(l.variantId)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit space-y-3 p-6">
          {toFree > 0 ? (
            <p className="rounded-xl bg-saffron/10 p-3 text-sm">Add {rupees(toFree)} more for <strong>free shipping</strong> 🌱</p>
          ) : (
            <p className="rounded-xl bg-leaf/10 p-3 text-sm font-semibold text-leaf">You&apos;ve unlocked free shipping! 🌟</p>
          )}
          <div className="flex justify-between"><span>Subtotal</span><span>{rupees(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{shipping ? rupees(shipping) : "Free"}</span></div>
          <div className="flex justify-between border-t border-earth/10 pt-3 text-lg font-bold"><span>Total</span><span>{rupees(subtotal + shipping)}</span></div>
          {hasProblems ? (
            <p className="text-sm text-red-700">Please fix the items marked above to continue.</p>
          ) : (
            <Link href="/checkout" className="btn-primary w-full">Proceed to checkout</Link>
          )}
          <Link href="/products" className="block text-center text-sm text-earth-light underline">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
