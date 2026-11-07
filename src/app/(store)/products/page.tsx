import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/catalog";
import { IMG } from "@/lib/images";

export const metadata = {
  title: "Sacred Cow-based Living for Eco-Conscious Products",
  description: "Pure, spiritual and eco-friendly cow-based products for home, health and rituals.",
};

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = [...new Set(products.map((p) => p.category))];
  return (
    <>
      <section className="relative isolate overflow-hidden bg-leaf-dark">
        <img src={IMG.aboutCow} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />
        <div className="container-x py-20 text-center">
          <p className="eyebrow mb-3 text-saffron-light">Products</p>
          <h1 className="mx-auto max-w-3xl text-4xl text-cream sm:text-5xl">
            Pure, Spiritual &amp; Eco-Friendly – Cow-Based Products for Home, Health &amp; Rituals
          </h1>
        </div>
      </section>
      <div className="container-x mt-12 space-y-14">
        {products.length === 0 && <p className="text-center">New products are on their way. Please check back soon.</p>}
        {categories.map((c) => (
          <section key={c}>
            <h2 className="mb-6 text-3xl">{c}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.filter((p) => p.category === c).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
