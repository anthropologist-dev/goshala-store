"use client";
import { useActionState } from "react";
import { submitUpiRef } from "@/app/(store)/order/[id]/actions";

export function UpiRefForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(submitUpiRef, null as null | { ok: boolean; message: string });
  return (
    <form action={action} className="mt-4 space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="label" htmlFor="upiRef">After paying, enter the UTR / transaction ID</label>
      <div className="flex gap-2">
        <input id="upiRef" name="upiRef" required className="input" placeholder="e.g. 412345678901" inputMode="numeric" />
        <button className="btn-primary shrink-0 px-4" disabled={pending}>{pending ? "…" : "Submit"}</button>
      </div>
      {state && <p className={`text-sm ${state.ok ? "text-leaf" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}
