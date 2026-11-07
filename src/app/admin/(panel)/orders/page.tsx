import Link from "next/link";
import { db } from "@/db";
import { rupees } from "@/lib/money";
import { Badge } from "@/components/admin/badges";
import { newestFirst, ORDER_FILTERS, orderWhere } from "@/lib/order-filters";

type SP = { status?: string; q?: string; page?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status ?? "ALL";
  const rows = await db.query.orders.findMany({
    where: orderWhere(sp),
    orderBy: newestFirst,
    limit: 51,
    offset: (page - 1) * 50,
    with: { items: { columns: { quantity: true } }, shipment: { columns: { trackingNumber: true } } },
  });
  const more = rows.length > 50;
  const qs = (p: Partial<SP>) => "?" + new URLSearchParams(Object.entries({ ...sp, ...p }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Orders</h1>
        <a href={`/api/admin/orders-csv${qs({ page: undefined })}`} className="btn-outline px-4 py-2">Export CSV</a>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {ORDER_FILTERS.map(([k, l]) => (
          <Link key={k} href={qs({ status: k, page: undefined })} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${status === k ? "bg-leaf text-cream" : "bg-white ring-1 ring-stone-200"}`}>
            {l}
          </Link>
        ))}
      </div>
      <form className="flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={sp.q} placeholder="Search order no., name, phone, PIN" className="input" />
        <button className="btn-primary px-4">Search</button>
      </form>

      {rows.length === 0 && <p className="card p-8 text-center text-stone-500">No orders here.</p>}
      <ul className="space-y-2">
        {rows.slice(0, 50).map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-2 p-4 hover:ring-leaf/30">
              <div>
                <p className="font-bold text-stone-900">{o.number} <span className="font-normal text-stone-500">· {o.name}</span></p>
                <p className="text-xs text-stone-500">
                  {o.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} · {o.city}, {o.state} · {o.items.reduce((a, i) => a + i.quantity, 0)} items
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge value={o.status} />
                <Badge value={o.paymentStatus} label={o.paymentMethod === "COD" && o.paymentStatus === "UNPAID" ? "COD" : undefined} />
                <span className="w-20 text-right font-bold">{rupees(o.total)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-between">
        {page > 1 ? <Link href={qs({ page: String(page - 1) })} className="text-sm font-semibold underline">← Newer</Link> : <span />}
        {more && <Link href={qs({ page: String(page + 1) })} className="text-sm font-semibold underline">Older →</Link>}
      </div>
    </div>
  );
}
