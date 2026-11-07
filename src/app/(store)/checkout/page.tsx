import { CheckoutForm } from "@/components/checkout-form";
import { getSettings } from "@/lib/settings";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <CheckoutForm
      settings={{
        freeShippingThreshold: s.freeShippingThreshold,
        flatShippingFee: s.flatShippingFee,
        codEnabled: s.codEnabled,
        codFee: s.codFee,
        upiEnabled: !!s.upiId,
      }}
    />
  );
}
