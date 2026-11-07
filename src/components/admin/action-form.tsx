"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/admin/actions";

export function ActionForm({
  action,
  children,
  className,
  submit = "Save",
  submitClass = "btn-primary",
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  className?: string;
  submit?: string | null;
  submitClass?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {submit && <SubmitButton className={submitClass}>{submit}</SubmitButton>}
      {state && (
        <p role="status" className={`text-sm font-semibold ${state.ok ? "text-leaf" : "text-red-700"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? "Working…" : children}
    </button>
  );
}
