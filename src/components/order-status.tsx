import type { OrderStatus } from "@/db/schema";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "PENDING", label: "Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED" || status === "RETURNED")
    return <p className="rounded-xl bg-earth/10 p-4 font-semibold">This order was {status.toLowerCase()}.</p>;
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex items-center gap-1">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex flex-1 flex-col items-center gap-1 text-center">
          <span className={`h-2 w-full rounded-full ${i <= idx ? "bg-leaf" : "bg-earth/15"}`} />
          <span className={`text-[11px] font-semibold sm:text-xs ${i <= idx ? "text-leaf" : "text-earth-light"}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
