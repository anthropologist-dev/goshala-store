import Link from "next/link";
import { InquiryForm } from "./inquiry-form";
import type { Settings } from "@/db/schema";

const SOCIAL = [
  { href: "https://www.facebook.com/profile.php?id=61573542276123", label: "Facebook", d: "M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H8v4h2v8h4v-8h3l1-4h-4V9.5c0-.3.2-.5.5-.5Z" },
  { href: "https://www.instagram.com/shrishivasadguru/", label: "Instagram", d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" },
  { href: "https://www.youtube.com/@ShriShivaSadguruGoushala", label: "YouTube", d: "M22 12s0-3.3-.4-4.8a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.7 2 12 2 12s0 3.3.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.5.4-4.8.4-4.8ZM10 15V9l5 3-5 3Z" },
  { href: "https://wa.me/message/BK7XX4AKEUYVB1", label: "WhatsApp", d: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5 13.6c-.2.6-1.2 1.1-1.7 1.2-.5 0-1 .2-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.2Z" },
];

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-20 bg-leaf-dark text-cream/90">
      <div className="container-x grid gap-10 py-14 md:grid-cols-3">
        <div>
          <h3 className="mb-4 text-2xl text-cream">Stay Connected</h3>
          <p className="text-sm leading-relaxed">
            Contact: <a href={`mailto:${settings.email}`} className="underline-offset-2 hover:underline">{settings.email}</a>
          </p>
          <p className="mt-1 text-sm">
            <a href="tel:+919448852888" className="hover:underline">+91 94488 52888</a> ·{" "}
            <a href="tel:+919916564986" className="hover:underline">+91 99165 64986</a>
          </p>
          <div className="mt-5 flex gap-3">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="rounded-full bg-cream/10 p-2.5 transition hover:bg-saffron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={s.d} /></svg>
              </a>
            ))}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <h4 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-saffron-light">Policies</h4>
          <Link href="/terms-and-conditions" className="block hover:underline">Terms and Conditions</Link>
          <Link href="/privacy-policy" className="block hover:underline">Privacy Policy</Link>
          <Link href="/shipping-and-refund-policy" className="block hover:underline">Refund Policy</Link>
          <Link href="/track" className="block hover:underline">Track your order</Link>
        </div>
        <div>
          <h4 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-saffron-light">Have a question?</h4>
          <InquiryForm />
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/60">
        Copyright {new Date().getFullYear()}. Powered by SRI SHIVASADGURU GAVYODYAMA
      </div>
    </footer>
  );
}
