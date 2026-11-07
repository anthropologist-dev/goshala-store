"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" },
  { href: "/admin/orders", label: "Orders", icon: "M7 4h10l1 4H6l1-4Zm-2 6h14v10H5V10Zm4 3v4m6-4v4" },
  { href: "/admin/products", label: "Products", icon: "M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" },
  { href: "/admin/inventory", label: "Inventory", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "M4 5h16v11H8l-4 4V5Z" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" },
];

export function AdminNav({ mobile }: { mobile?: boolean }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  if (mobile)
    return (
      <ul className="grid grid-cols-6">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active(i.href) ? "text-saffron" : "text-stone-500"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d={i.icon} /></svg>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  return (
    <ul className="space-y-1">
      {ITEMS.map((i) => (
        <li key={i.href}>
          <Link href={i.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${active(i.href) ? "bg-cream/15 text-cream" : "text-cream/70 hover:bg-cream/10"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d={i.icon} /></svg>
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
