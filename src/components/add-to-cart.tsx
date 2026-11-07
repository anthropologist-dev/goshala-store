"use client";
import { useState } from "react";
import { useCart, type CartLine } from "./cart";

export function AddToCart({ line, disabled, compact, qty = 1 }: { line: Omit<CartLine, "quantity">; disabled?: boolean; compact?: boolean; qty?: number }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(line, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className={compact ? "btn-primary px-4 py-2" : "btn-primary w-full sm:w-auto"}
    >
      {disabled ? "Sold out" : added ? "Added ✓" : compact ? "Add" : "Add to cart"}
    </button>
  );
}
