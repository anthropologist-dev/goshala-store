import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/lib/catalog";
import { ProductBuyBox } from "@/components/product-buy-box";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return { title: `${p.name} - Sri Shivasadguru Goushala`, description: p.tagline || p.description, openGraph: { images: p.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  return (
    <div className="container-x py-10">
      <nav className="mb-6 text-sm text-earth-light">
        <Link href="/products" className="hover:text-saffron">Products</Link> / <span>{p.name}</span>
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          {p.images.map((src, i) => (
            <img key={src} src={src} alt={i === 0 ? p.name : `${p.name} image ${i + 1}`} className="w-full rounded-3xl bg-white object-cover shadow-sm" />
          ))}
        </div>
        <div className="md:sticky md:top-32 md:self-start">
          <p className="eyebrow mb-2">{p.category}</p>
          <h1 className="text-4xl sm:text-5xl">{p.name}</h1>
          {p.tagline && <p className="mt-2 text-lg text-earth-light">{p.tagline}</p>}
          <ProductBuyBox
            product={{ name: p.name, slug: p.slug, image: p.images[0] }}
            variants={p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, mrp: v.mrp, stock: v.stock }))}
          />
          {p.description && <p className="mt-8 leading-relaxed">{p.description}</p>}
          {p.features.length > 0 && (
            <>
              <h2 className="mt-8 text-2xl">Why you&apos;ll love it</h2>
              <ul className="mt-3 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><span className="text-saffron">✦</span>{f}</li>
                ))}
              </ul>
            </>
          )}
          {p.usage.length > 0 && (
            <>
              <h2 className="mt-8 text-2xl">How to use</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                {p.usage.map((u) => <li key={u}>{u}</li>)}
              </ol>
            </>
          )}
          <div className="mt-8 rounded-2xl bg-leaf/5 p-5 text-sm">
            🌿 Part of every purchase supports GouSeva at our goshala.
          </div>
        </div>
      </div>
    </div>
  );
}
