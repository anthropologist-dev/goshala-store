"use client";
import { useActionState } from "react";
import { submitInquiry } from "@/app/actions";

export function InquiryForm() {
  const [state, action, pending] = useActionState(submitInquiry, null as null | { ok: boolean; message: string });
  return (
    <form action={action} className="flex flex-col gap-2">
      <input name="email" type="email" required placeholder="Enter your email address here" className="input" />
      <textarea name="message" rows={2} placeholder="Your message (optional)" className="input" />
      <button className="btn-accent" disabled={pending}>{pending ? "Sending…" : "Submit your inquiry now"}</button>
      {state && <p className={`text-sm ${state.ok ? "text-cream" : "text-saffron-light"}`}>{state.message}</p>}
    </form>
  );
}
