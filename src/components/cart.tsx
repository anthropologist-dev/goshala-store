"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  variantId: string;
  quantity: number;
  name: string;
  label: string;
  price: number; // paise, as shown when added; the server re-checks at checkout
  image?: string;
  slug: string;
};

type Ctx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (l: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "ssg-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback<Ctx["add"]>((l, qty = 1) => {
    setLines((cur) => {
      const found = cur.find((c) => c.variantId === l.variantId);
      if (found) return cur.map((c) => (c.variantId === l.variantId ? { ...c, ...l, quantity: Math.min(50, c.quantity + qty) } : c));
      return [...cur, { ...l, quantity: qty }];
    });
  }, []);
  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((cur) => (qty <= 0 ? cur.filter((c) => c.variantId !== variantId) : cur.map((c) => (c.variantId === variantId ? { ...c, quantity: Math.min(50, qty) } : c))));
  }, []);
  const remove = useCallback((variantId: string) => setLines((cur) => cur.filter((c) => c.variantId !== variantId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      ready,
      count: lines.reduce((a, l) => a + l.quantity, 0),
      subtotal: lines.reduce((a, l) => a + l.quantity * l.price, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, ready, add, setQty, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
