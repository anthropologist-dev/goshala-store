"use server";
import { z } from "zod";
import { db, schema } from "@/db";

export async function submitInquiry(_: unknown, form: FormData) {
  const parsed = z
    .object({ email: z.string().trim().email(), message: z.string().trim().max(1000).optional() })
    .safeParse({ email: form.get("email"), message: form.get("message") || undefined });
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };
  await db.insert(schema.inquiries).values(parsed.data);
  return { ok: true, message: "Thank you! We'll get back to you soon. 🙏" };
}
