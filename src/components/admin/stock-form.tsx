import { ActionForm } from "./action-form";
import { stockAdjust } from "@/app/admin/actions";

export function StockForm({ variantId }: { variantId: string }) {
  return (
    <ActionForm action={stockAdjust} className="flex flex-wrap items-center gap-2" submit="Update" submitClass="btn-primary px-3 py-2">
      <input type="hidden" name="variantId" value={variantId} />
      <select name="reason" className="input w-auto py-2" defaultValue="RESTOCK" aria-label="Reason">
        <option value="RESTOCK">+ Restock</option>
        <option value="DAMAGE">− Damaged</option>
        <option value="ADJUSTMENT">± Correction</option>
      </select>
      <input name="delta" type="number" required className="input w-20 py-2" placeholder="Qty" aria-label="Quantity" />
      <input name="note" className="input w-36 py-2" placeholder="Note (optional)" aria-label="Note" />
    </ActionForm>
  );
}
