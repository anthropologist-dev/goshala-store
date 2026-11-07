import { CartView } from "@/components/cart-view";
import { getSettings } from "@/lib/settings";
export const metadata = { title: "Your cart" };

export default async function CartPage() {
  const s = await getSettings();
  return <CartView freeShippingThreshold={s.freeShippingThreshold} flatShippingFee={s.flatShippingFee} />;
}
