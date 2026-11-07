import type { Product } from "@/db/schema";
import { ActionForm } from "./action-form";
import { saveProduct } from "@/app/admin/actions";

export function ProductForm({ p }: { p?: Product }) {
  return (
    <ActionForm action={saveProduct} className="card grid gap-4 p-5 sm:grid-cols-2" submit="Save product" submitClass="btn-primary sm:col-span-2">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <div><label className="label">Name</label><input name="name" required defaultValue={p?.name} className="input" /></div>
      <div><label className="label">URL slug</label><input name="slug" required defaultValue={p?.slug} className="input" placeholder="e.g. gomaya-powder" /></div>
      <div className="sm:col-span-2"><label className="label">Tagline</label><input name="tagline" defaultValue={p?.tagline ?? ""} className="input" /></div>
      <div className="sm:col-span-2"><label className="label">Description</label><textarea name="description" rows={4} defaultValue={p?.description} className="input" /></div>
      <div><label className="label">Key features (one per line)</label><textarea name="features" rows={5} defaultValue={p?.features.join("\n")} className="input" /></div>
      <div><label className="label">How to use (one step per line)</label><textarea name="usage" rows={5} defaultValue={p?.usage.join("\n")} className="input" /></div>
      <div className="sm:col-span-2"><label className="label">Image URLs (one per line, first is the main image)</label><textarea name="images" rows={3} defaultValue={p?.images.join("\n")} className="input font-mono text-xs" /></div>
      <div><label className="label">Category</label><input name="category" required defaultValue={p?.category ?? "Pooja Essentials"} className="input" /></div>
      <div><label className="label">Sort order</label><input name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} className="input" /></div>
      <div><label className="label">HSN code</label><input name="hsnCode" defaultValue={p?.hsnCode ?? ""} className="input" /></div>
      <div><label className="label">GST rate % (price includes it)</label><input name="gstRate" type="number" step="0.01" min={0} max={28} defaultValue={p?.gstRate ?? "0"} className="input" /></div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={p?.active ?? false} className="h-4 w-4 accent-leaf" /> Visible in store</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="featured" defaultChecked={p?.featured ?? false} className="h-4 w-4 accent-leaf" /> Show on home page</label>
    </ActionForm>
  );
}
