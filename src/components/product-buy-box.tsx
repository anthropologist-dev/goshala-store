"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart";
import { rupees } from "@/lib/money";

type V = { id: string; label: string; price: number; mrp: number | null; stock: number };

export function ProductBuyBox({ product, variants }: { product: { name: string; slug: string; image?: string }; variants: V[] }) {
  const [sel, setSel] = useState(variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const v = variants.find((x) => x.id === sel)!;
  if (!v) return null;
  const max = Math.min(10, v.stock);

  return (
    <div className="mt-6">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-leaf">{rupees(v.price)}</span>
        {v.mrp && v.mrp > v.price && <span className="text-lg text-earth-light line-through">{rupees(v.mrp)}</span>}
        <span className="text-xs text-earth-light">incl. of all taxes</span>
      </div>
      {variants.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {variants.map((x) => (
            <button
              key={x.id}
              onClick={() => { setSel(x.id); setQty(1); }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${x.id === sel ? "border-leaf bg-leaf text-cream" : "border-earth/20 bg-white"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
      {variants.length === 1 && <p className="mt-2 text-sm text-earth-light">Pack: {v.label}</p>}
      <p className={`mt-3 text-sm font-semibold ${v.stock > 0 ? (v.stock <= 5 ? "text-saffron" : "text-leaf") : "text-red-700"}`}>
        {v.stock <= 0 ? "Out of stock" : v.stock <= 5 ? `Only ${v.stock} left` : "In stock"}
      </p>
      {v.stock > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-earth/20 bg-white">
            <button className="px-4 py-2 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
            <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
            <button className="px-4 py-2 text-lg" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Increase quantity">+</button>
          </div>
          <button
            className="btn-primary flex-1 sm:flex-none"
            onClick={() => {
              add({ variantId: v.id, name: product.name, label: v.label, price: v.price, image: product.image, slug: product.slug }, qty);
              setAdded(true);
            }}
          >
            Add to cart
          </button>
        </div>
      )}
      {added && (
        <p className="mt-3 text-sm">
          Added to your cart. <Link href="/cart" className="font-bold text-saffron underline">View cart →</Link>
        </p>
      )}
    </div>
  );
}
