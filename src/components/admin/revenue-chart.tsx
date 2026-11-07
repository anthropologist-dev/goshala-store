"use client";
import { useState } from "react";
import { rupees } from "@/lib/money";

type Point = { day: string; revenue: number; orders: number };

const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function niceMax(v: number) {
  if (v <= 0) return 100000; // ₹1,000
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / p / 2) * 2 * p;
}

export function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 720, H = 220, L = 52, B = 24, T = 8;
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const bw = (W - L) / data.length;
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(data.length / 7);
  const h = hover != null ? data[hover] : null;

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily revenue chart" onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="#e7e5e4" strokeWidth={1} />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#78716c">{rupees(t).replace(/\.00$/, "")}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = L + i * bw;
            const top = y(d.revenue);
            const bar = Math.max(0, H - B - top);
            const w = Math.max(2, bw - 2);
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
                <rect x={x} y={T} width={bw} height={H - T - B} fill="transparent" />
                {bar > 0 && (
                  <path
                    d={`M${x + 1},${H - B} V${top + Math.min(4, bar)} q0,-4 4,-4 h${w - 8} q4,0 4,4 V${H - B} Z`}
                    fill={hover === i ? "#1F331E" : "#46703F"}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#78716c">{fmtDay(d.day)}</text>
                )}
              </g>
            );
          })}
          <line x1={L} x2={W} y1={H - B} y2={H - B} stroke="#a8a29e" strokeWidth={1} />
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-stone-200"
            style={{ left: `${Math.min(80, ((L + (hover! + 0.5) * bw) / W) * 100)}%` }}
          >
            <p className="font-semibold text-stone-500">{fmtDay(h.day)}</p>
            <p className="text-sm font-bold text-stone-900">{rupees(h.revenue)}</p>
            <p className="text-stone-500">{h.orders} order{h.orders === 1 ? "" : "s"}</p>
          </div>
        )}
      </div>
      <button onClick={() => setTable((t) => !t)} className="mt-2 text-xs font-semibold text-stone-500 underline">
        {table ? "Hide table" : "Show as table"}
      </button>
      {table && (
        <table className="mt-2 w-full text-left text-xs">
          <thead><tr className="text-stone-500"><th className="py-1">Day</th><th>Orders</th><th className="text-right">Revenue</th></tr></thead>
          <tbody>
            {data.filter((d) => d.orders).map((d) => (
              <tr key={d.day} className="border-t border-stone-100"><td className="py-1">{fmtDay(d.day)}</td><td>{d.orders}</td><td className="text-right">{rupees(d.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
