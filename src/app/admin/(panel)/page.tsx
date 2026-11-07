import Link from "next/link";
import { getActionItems, getAnalytics } from "@/lib/analytics";
import { rupees } from "@/lib/money";
import { RevenueChart } from "@/components/admin/revenue-chart";

const RANGES = [7, 30, 90, 365];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const d = Number((await searchParams).days);
  const days = RANGES.includes(d) ? d : 30;
  const [a, act] = await Promise.all([getAnalytics(days), getActionItems()]);
  const aov = a.totals.orders ? Math.round(a.totals.revenue / a.totals.orders) : 0;
  const topMax = Math.max(1, ...a.top.map((t) => t.revenue));

  const todo = [
    { n: act.upiToVerify, label: "UPI payments to verify", href: "/admin/orders?status=VERIFY" },
    { n: act.statusCounts.PENDING ?? 0, label: "New orders", href: "/admin/orders?status=PENDING" },
    { n: (act.statusCounts.CONFIRMED ?? 0) + (act.statusCounts.PACKED ?? 0), label: "To pack & ship", href: "/admin/orders?status=TO_SHIP" },
    { n: act.lowStock.length, label: "Low on stock", href: "/admin/inventory" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Dashboard</h1>
        <div className="flex rounded-full bg-white p-1 text-sm shadow-sm ring-1 ring-stone-200">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin?days=${r}`} className={`rounded-full px-3 py-1 font-semibold ${r === days ? "bg-leaf text-cream" : "text-stone-600"}`}>
              {r === 365 ? "1y" : `${r}d`}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {todo.map((t) => (
          <Link key={t.label} href={t.href} className={`card p-4 ${t.n ? "ring-2 ring-saffron/40" : ""}`}>
            <p className="text-3xl font-bold text-stone-900">{t.n}</p>
            <p className="text-sm text-stone-500">{t.label}</p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Revenue", rupees(a.totals.revenue)],
          ["Orders", a.totals.orders],
          ["Avg. order value", rupees(aov)],
          ["Items sold", a.totals.items],
        ].map(([l, v]) => (
          <div key={l} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{l}</p>
            <p className="mt-1 text-2xl font-bold text-stone-900">{v}</p>
          </div>
        ))}
      </section>
      <p className="-mt-3 text-xs text-stone-500">
        Last {days} days, excluding {a.cancelled} cancelled/returned order{a.cancelled === 1 ? "" : "s"}. Revenue includes shipping ({rupees(a.totals.shipping)}).
      </p>

      <section className="card p-5">
        <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Daily revenue</h2>
        <RevenueChart data={a.series} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Top products</h2>
          {a.top.length === 0 && <p className="text-sm text-stone-500">No sales in this period yet.</p>}
          <ul className="space-y-3">
            {a.top.map((t) => (
              <li key={t.name}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{t.name}</span><span>{rupees(t.revenue)} · {t.qty} sold</span></div>
                <div className="mt-1 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-leaf-light" style={{ width: `${(t.revenue / topMax) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Payments &amp; regions</h2>
          <table className="w-full text-sm">
            <tbody>
              {a.payment.map((p) => (
                <tr key={p.method} className="border-b border-stone-100"><td className="py-2 font-semibold">{p.method === "COD" ? "Cash on Delivery" : "UPI"}</td><td>{p.n} orders</td><td className="text-right">{rupees(p.revenue)}</td></tr>
              ))}
              {a.states.map((s) => (
                <tr key={s.state} className="border-b border-stone-100"><td className="py-2">{s.state}</td><td>{s.n} orders</td><td className="text-right">{rupees(s.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
          {!a.payment.length && <p className="text-sm text-stone-500">No orders in this period yet.</p>}
        </section>
      </div>

      {act.lowStock.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-stone-500">Low stock</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {act.lowStock.map((v) => (
              <li key={v.id} className="flex justify-between py-2">
                <Link href={`/admin/products/${v.productId}`} className="font-semibold hover:underline">{v.name} · {v.label}</Link>
                <span className={v.stock <= 0 ? "font-bold text-red-700" : "text-amber-700"}>{v.stock <= 0 ? "Out of stock" : `${v.stock} left`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
