import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import { AdminNav } from "@/components/admin/nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-stone-50 pb-20 md:pb-0 md:pl-56">
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col bg-leaf-dark p-4 text-cream md:flex">
        <Link href="/admin" className="mb-6 px-3 font-serif text-2xl font-bold">Goshala Admin</Link>
        <AdminNav />
        <div className="mt-auto space-y-2 px-3 text-xs text-cream/60">
          <p className="truncate">{admin.email}</p>
          <Link href="/" target="_blank" className="block hover:text-cream">View store ↗</Link>
          <form action={logout}><button className="hover:text-cream">Sign out</button></form>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-leaf-dark px-4 py-3 text-cream md:hidden">
        <Link href="/admin" className="font-serif text-xl font-bold">Goshala Admin</Link>
        <form action={logout}><button className="text-xs text-cream/70">Sign out</button></form>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white md:hidden">
        <AdminNav mobile />
      </nav>
      <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
    </div>
  );
}
