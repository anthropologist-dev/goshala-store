import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { rupees } from "@/lib/money";

export default async function ProductsAdmin() {
  const products = await db.query.products.findMany({ orderBy: [asc(schema.products.sortOrder), asc(schema.products.name)], with: { variants: true } });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Products</h1>
        <Link href="/admin/products/new" className="btn-primary px-4 py-2">+ New product</Link>
      </div>
      <ul className="space-y-2">
        {products.map((p) => {
          const stock = p.variants.reduce((a, v) => a + v.stock, 0);
          const low = p.variants.some((v) => v.active && v.stock <= v.lowStockAt);
          return (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="card flex items-center gap-4 p-3">
                <img src={p.images[0]} alt="" className="h-14 w-14 rounded-lg bg-stone-100 object-cover" />
                <div className="flex-1">
                  <p className="font-bold text-stone-900">
                    {p.name} {!p.active && <span className="ml-1 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] uppercase">Hidden</span>}
                  </p>
                  <p className="text-xs text-stone-500">
                    {p.category} · {p.variants.map((v) => `${v.label} ${rupees(v.price)}`).join(" · ")}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${stock <= 0 ? "text-red-700" : low ? "text-amber-700" : "text-stone-700"}`}>{stock} in stock</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
