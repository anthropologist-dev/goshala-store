const STATUS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-sky-100 text-sky-900",
  PACKED: "bg-indigo-100 text-indigo-900",
  SHIPPED: "bg-violet-100 text-violet-900",
  IN_TRANSIT: "bg-violet-100 text-violet-900",
  DELIVERED: "bg-emerald-100 text-emerald-900",
  CANCELLED: "bg-stone-200 text-stone-700",
  RETURNED: "bg-rose-100 text-rose-900",
  UNPAID: "bg-stone-100 text-stone-700",
  CLAIMED: "bg-amber-100 text-amber-900",
  PAID: "bg-emerald-100 text-emerald-900",
  REFUNDED: "bg-rose-100 text-rose-900",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS[value] ?? "bg-stone-100"}`}>
      {label ?? (value === "CLAIMED" ? "Verify UPI" : value.replace("_", " ").toLowerCase())}
    </span>
  );
}
