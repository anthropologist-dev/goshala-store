import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { rupees } from "@/lib/money";
import { ProductForm } from "@/components/admin/product-form";
import { ActionForm } from "@/components/admin/action-form";
import { StockForm } from "@/components/admin/stock-form";
import { saveVariant } from "../../../actions";
import type { Variant } from "@/db/schema";

function VariantFields({ v, productId }: { v?: Variant; productId: string }) {
  return (
    <>
      <input type="hidden" name="id" value={v?.id ?? ""} />
      <input type="hidden" name="productId" value={productId} />
      <div><label className="label">Pack label</label><input name="label" required defaultValue={v?.label} className="input" placeholder="250 g" /></div>
      <div><label className="label">SKU</label><input name="sku" required defaultValue={v?.sku} className="input" /></div>
      <div><label className="label">Price ₹</label><input name="price" type="number" step="0.01" required defaultValue={v ? v.price / 100 : ""} className="input" /></div>
      <div><label className="label">MRP ₹ (optional)</label><input name="mrp" type="number" step="0.01" defaultValue={v?.mrp ? v.mrp / 100 : ""} className="input" /></div>
      <div><label className="label">Shipping weight (g)</label><input name="weightGrams" type="number" required defaultValue={v?.weightGrams ?? 250} className="input" /></div>
      <div><label className="label">Low-stock alert at</label><input name="lowStockAt" type="number" required defaultValue={v?.lowStockAt ?? 10} className="input" /></div>
      {!v && <div><label className="label">Opening stock</label><input name="openingStock" type="number" min={0} defaultValue={0} className="input" /></div>}
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={v?.active ?? true} className="h-4 w-4 accent-leaf" /> On sale</label>
    </>
  );
}

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, id), with: { variants: { orderBy: asc(schema.variants.price) } } });
  if (!p) notFound();
  const ids = p.variants.map((v) => v.id);
  const moves = ids.length
    ? await db.query.stockMovements.findMany({ where: inArray(schema.stockMovements.variantId, ids), orderBy: desc(schema.stockMovements.createdAt), limit: 15, with: { variant: { columns: { label: true } } } })
    : [];

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="text-sm text-stone-500 hover:underline">← Products</Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl">{p.name}</h1>
        {p.active && <Link href={`/products/${p.slug}`} target="_blank" className="text-sm font-semibold text-saffron">View in store ↗</Link>}
      </div>
      <ProductForm p={p} />

      <section className="space-y-3">
        <h2 className="text-2xl">Packs &amp; stock</h2>
        {p.variants.map((v) => (
          <div key={v.id} className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-stone-900">{v.label} · {rupees(v.price)}</p>
              <p className={`text-lg font-bold ${v.stock <= 0 ? "text-red-700" : v.stock <= v.lowStockAt ? "text-amber-700" : "text-leaf"}`}>{v.stock} in stock</p>
            </div>
            <StockForm variantId={v.id} />
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-stone-600">Edit pack details</summary>
              <ActionForm action={saveVariant} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" submit="Save pack" submitClass="btn-primary lg:col-span-4">
                <VariantFields v={v} productId={p.id} />
              </ActionForm>
            </details>
          </div>
        ))}
        <details className="card p-5" open={p.variants.length === 0}>
          <summary className="cursor-pointer font-semibold">+ Add a pack size</summary>
          <ActionForm action={saveVariant} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" submit="Add pack" submitClass="btn-primary lg:col-span-4">
            <VariantFields productId={p.id} />
          </ActionForm>
        </details>
      </section>

      {moves.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Recent stock movements</h2>
          <table className="w-full text-sm">
            <tbody>
              {moves.map((m) => (
                <tr key={m.id} className="border-b border-stone-100">
                  <td className="py-1.5 text-stone-500">{m.createdAt.toLocaleDateString("en-IN")}</td>
                  <td>{m.variant.label}</td>
                  <td className="lowercase">{m.reason}</td>
                  <td className={`text-right font-semibold ${m.delta > 0 ? "text-leaf" : "text-red-700"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="text-right text-stone-500">→ {m.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
