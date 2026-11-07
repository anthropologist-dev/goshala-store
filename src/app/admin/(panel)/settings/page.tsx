import { getSettings } from "@/lib/settings";
import { ActionForm } from "@/components/admin/action-form";
import { changePassword, saveSettings } from "../../actions";
import { INDIAN_STATES } from "@/lib/money";

export default async function SettingsPage() {
  const s = await getSettings();
  const f = (name: keyof typeof s, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} defaultValue={String(s[name] ?? "")} className="input" {...extra} />
    </div>
  );
  const money = (name: "freeShippingThreshold" | "flatShippingFee" | "codFee", label: string) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type="number" step="0.01" min={0} defaultValue={s[name] / 100} className="input" />
    </div>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Settings</h1>
      <ActionForm action={saveSettings} className="space-y-6" submit="Save settings">
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-xl sm:col-span-2">Business &amp; invoices</h2>
          {f("businessName", "Business name")}
          {f("gstin", "GSTIN (leave blank if not registered)")}
          <div className="sm:col-span-2">{f("address", "Address (on invoices and labels)")}</div>
          <div>
            <label className="label" htmlFor="sellerState">Your state (decides CGST+SGST vs IGST)</label>
            <select id="sellerState" name="sellerState" defaultValue={s.sellerState} className="input">{INDIAN_STATES.map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          {f("invoicePrefix", "Invoice number prefix")}
          {f("email", "Contact email", { type: "email" })}
          {f("phone", "Contact phone")}
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-xl sm:col-span-2">Payments</h2>
          {f("upiId", "UPI ID for payments", { placeholder: "yourname@okaxis" })}
          {f("upiName", "Payee name shown in UPI apps")}
          {money("codFee", "Extra COD charge ₹ (0 for none)")}
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold"><input type="checkbox" name="codEnabled" defaultChecked={s.codEnabled} className="h-4 w-4 accent-leaf" /> Offer Cash on Delivery</label>
          {!s.upiId && <p className="text-sm text-amber-700 sm:col-span-2">UPI is hidden at checkout until you add a UPI ID.</p>}
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-xl sm:col-span-2">Shipping</h2>
          {money("freeShippingThreshold", "Free shipping on orders from ₹")}
          {money("flatShippingFee", "Shipping charge below that ₹")}
          {f("defaultCarrier", "Default carrier")}
          {f("trackingUrlTemplate", "Tracking link ({tracking} is replaced with the number)")}
        </section>
      </ActionForm>
      <ActionForm action={changePassword} className="card grid gap-4 p-5 sm:grid-cols-2" submit="Change password" submitClass="btn-outline sm:col-span-2">
        <h2 className="text-xl sm:col-span-2">Admin password</h2>
        <div><label className="label" htmlFor="current">Current password</label><input id="current" name="current" type="password" required className="input" autoComplete="current-password" /></div>
        <div><label className="label" htmlFor="next">New password</label><input id="next" name="next" type="password" required minLength={10} className="input" autoComplete="new-password" /></div>
      </ActionForm>
    </div>
  );
}
