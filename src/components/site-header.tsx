"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart";
import { IMG } from "@/lib/images";
import { rupees } from "@/lib/money";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About Us" },
  { href: "/products", label: "Products" },
  { href: "/mission", label: "Mission" },
];

export function SiteHeader({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-leaf px-4 py-2 text-center text-xs font-semibold tracking-wide text-cream sm:text-sm">
        Get FREE Shipping on All Eco-Friendly Orders Above {rupees(freeShippingThreshold)}! 🌱🌟
      </div>
      <div className="border-b border-earth/10 bg-cream/95 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link href="/" className="flex items-center gap-3" aria-label="Sri Shivasadguru Goushala home">
            <img src={IMG.logo} alt="Sri Shivasadguru Goushala" className="h-10 w-auto sm:h-12" />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm font-semibold tracking-wide transition hover:text-saffron ${path === n.href ? "text-saffron" : "text-leaf-dark"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative rounded-full p-2 text-leaf-dark hover:bg-cream-dark" aria-label={`Cart, ${count} items`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="20" r="1.3" />
                <circle cx="17" cy="20" r="1.3" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-saffron px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <button className="rounded-full p-2 text-leaf-dark md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-earth/10 md:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block px-6 py-3 font-semibold text-leaf-dark">
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
