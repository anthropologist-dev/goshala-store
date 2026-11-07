import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProduct() {
  return (
    <div className="space-y-4">
      <Link href="/admin/products" className="text-sm text-stone-500 hover:underline">← Products</Link>
      <h1 className="text-3xl">New product</h1>
      <p className="text-sm text-stone-500">Save the product first, then add packs (sizes, prices and stock).</p>
      <ProductForm />
    </div>
  );
}
