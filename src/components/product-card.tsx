import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog";
import { rupees } from "@/lib/money";
import { AddToCart } from "./add-to-cart";

export function ProductCard({ p }: { p: CatalogProduct }) {
  const v = p.variants[0];
  const inStock = p.variants.some((x) => x.stock > 0);
  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link href={`/products/${p.slug}`} className="relative block aspect-square overflow-hidden bg-cream-dark">
        <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {!inStock && <span className="absolute left-3 top-3 rounded-full bg-earth px-3 py-1 text-xs font-bold text-white">Sold out</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow mb-1">{p.category}</p>
        <Link href={`/products/${p.slug}`}>
          <h3 className="text-2xl leading-tight">{p.name}</h3>
        </Link>
        {p.tagline && <p className="mt-1 line-clamp-2 text-sm text-earth-light">{p.tagline}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <span className="text-lg font-bold text-leaf">{rupees(v.price)}</span>
            {v.mrp && v.mrp > v.price && <span className="ml-2 text-sm text-earth-light line-through">{rupees(v.mrp)}</span>}
            <p className="text-xs text-earth-light">{v.label}</p>
          </div>
          <AddToCart
            compact
            disabled={v.stock <= 0}
            line={{ variantId: v.id, name: p.name, label: v.label, price: v.price, image: p.images[0], slug: p.slug }}
          />
        </div>
      </div>
    </div>
  );
}
