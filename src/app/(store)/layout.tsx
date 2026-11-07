import { CartProvider } from "@/components/cart";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <CartProvider>
      <SiteHeader freeShippingThreshold={settings.freeShippingThreshold} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </CartProvider>
  );
}
