import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { rupees } from "@/lib/money";
import { StockForm } from "@/components/admin/stock-form";

export default async function Inventory() {
  const rows = await db
    .select({ v: schema.variants, p: { id: schema.products.id, name: schema.products.name, active: schema.products.active } })
    .from(schema.variants)
    .innerJoin(schema.products, eq(schema.variants.productId, schema.products.id))
    .orderBy(asc(schema.variants.stock));
  const value = rows.reduce((a, r) => a + Math.max(0, r.v.stock) * r.v.price, 0);
  const units = rows.reduce((a, r) => a + Math.max(0, r.v.stock), 0);
  const moves = await db.query.stockMovements.findMany({
    orderBy: desc(schema.stockMovements.createdAt),
    limit: 30,
    with: { variant: { columns: { sku: true, label: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Inventory</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Units in stock</p><p className="text-2xl font-bold">{units}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Stock value (at price)</p><p className="text-2xl font-bold">{rupees(value)}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Low / out</p><p className="text-2xl font-bold">{rows.filter((r) => r.v.active && r.p.active && r.v.stock <= r.v.lowStockAt).length}</p></div>
      </div>
      <ul className="space-y-2">
        {rows.map(({ v, p }) => (
          <li key={v.id} className={`card space-y-3 p-4 ${!v.active || !p.active ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/admin/products/${p.id}`} className="font-semibold text-stone-900 hover:underline">
                {p.name} · {v.label} <span className="text-xs font-normal text-stone-400">{v.sku}</span>
              </Link>
              <span className={`font-bold ${v.stock <= 0 ? "text-red-700" : v.stock <= v.lowStockAt ? "text-amber-700" : "text-leaf"}`}>
                {v.stock} {v.stock <= v.lowStockAt && v.stock > 0 && <span className="text-xs font-semibold">(low)</span>}
              </span>
            </div>
            <StockForm variantId={v.id} />
          </li>
        ))}
      </ul>
      <section className="card p-5">
        <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Stock log</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="text-left text-xs text-stone-500"><th className="py-1">When</th><th>SKU</th><th>Reason</th><th>Note</th><th className="text-right">Change</th><th className="text-right">Balance</th></tr></thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id} className="border-t border-stone-100">
                  <td className="py-1.5 text-stone-500">{m.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })}</td>
                  <td>{m.variant.sku}</td>
                  <td className="lowercase">{m.reason}</td>
                  <td className="text-stone-500">{m.note}</td>
                  <td className={`text-right font-semibold ${m.delta > 0 ? "text-leaf" : "text-red-700"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="text-right">{m.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
