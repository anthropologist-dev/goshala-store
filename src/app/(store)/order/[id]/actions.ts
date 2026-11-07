"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";

export async function submitUpiRef(_: unknown, form: FormData) {
  const id = String(form.get("orderId") ?? "");
  const ref = String(form.get("upiRef") ?? "").replace(/\s/g, "");
  if (!/^[A-Za-z0-9]{8,30}$/.test(ref)) return { ok: false, message: "Enter the 12-digit UTR / transaction ID from your UPI app." };
  const [o] = await db
    .update(schema.orders)
    .set({ upiRef: ref, paymentStatus: "CLAIMED" })
    .where(and(eq(schema.orders.id, id), eq(schema.orders.paymentMethod, "UPI"), eq(schema.orders.paymentStatus, "UNPAID")))
    .returning({ id: schema.orders.id });
  if (!o) return { ok: false, message: "This order can't be updated." };
  revalidatePath(`/order/${id}`);
  return { ok: true, message: "Thank you! We'll confirm your payment shortly." };
}
