import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/catalog";
import { IMG } from "@/lib/images";

export default async function Home() {
  const featured = await getProducts({ featuredOnly: true });

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img src={IMG.heroCow} alt="Native desi cow at the goshala" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-leaf-dark/85 via-leaf-dark/55 to-transparent" />
        <div className="container-x flex min-h-[70vh] flex-col justify-center py-24">
          <p className="eyebrow mb-4 text-saffron-light">Eco-Conscious</p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] text-cream sm:text-6xl lg:text-7xl">
            Revive Ancient Cow-Based Living for a Greener Tomorrow
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn-accent">Products</Link>
            <Link href="/about-us" className="btn border border-cream/60 text-cream hover:bg-cream hover:text-leaf-dark">Our story</Link>
          </div>
        </div>
      </section>

      {/* Three tiles */}
      <section className="container-x -mt-12 grid gap-5 md:grid-cols-3">
        {[
          { img: IMG.poojaEssentials, title: "Pooja Essentials from Native Cows", text: "Traditional, cleansed essentials crafted for divine worship.", href: "/products", cta: "Discover" },
          { img: IMG.pushpakaBanner, title: "Pure and Natural Cow Products", text: "No donations. Just pure, chemical-free formulations.", href: "/about-us", cta: "Read" },
          { img: IMG.woodenCow, title: "Cow-Based Living", text: "Reviving ancient wisdom for a sustainable, spiritual home.", href: "/reviving-ancient-wisdom-embrace-cow-based-living-with-ssgp", cta: "Browse" },
        ].map((t) => (
          <Link key={t.title} href={t.href} className="card group overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden bg-cream-dark">
              <img src={t.img} alt={t.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="p-6">
              <h3 className="text-2xl">{t.title}</h3>
              <p className="mt-2 text-sm text-earth-light">{t.text}</p>
              <span className="mt-4 inline-block text-sm font-bold text-saffron">{t.cta} →</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Flagship */}
      <section className="container-x mt-24 grid items-center gap-10 md:grid-cols-2">
        <img src={IMG.poojaEssentials} alt="TaamraGoura, the goshala's flagship product" className="w-full rounded-3xl object-cover shadow-lg" />
        <div>
          <p className="eyebrow mb-3">Our flagship</p>
          <h2 className="text-4xl sm:text-5xl">TaamraGoura</h2>
          <p className="mt-4 text-lg leading-relaxed">
            World&apos;s 1st cow-dung based, chemical-free organic shining and cleaning agent for copper, brass, bronze and steel utensils.
          </p>
          <Link href="/products/tamaragaoura" className="btn-primary mt-6">More</Link>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container-x mt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Shop</p>
              <h2 className="text-4xl">Pure and Natural Cow Products</h2>
            </div>
            <Link href="/products" className="hidden text-sm font-bold text-saffron sm:block">View all →</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* Embrace tradition */}
      <section className="container-x mt-24 text-center">
        <h2 className="text-4xl sm:text-5xl">Embrace Tradition, Live Sustainably</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed">
          Reviving ancient wisdom through cow-based living, we offer eco-conscious pooja essentials that connect you to purity and sustainability.
        </p>
      </section>

      {/* GouSeva */}
      <section className="container-x mt-16 grid items-center gap-10 rounded-3xl bg-leaf p-6 text-cream sm:p-10 md:grid-cols-2">
        <div>
          <h2 className="text-3xl text-cream sm:text-4xl">Part of Your Purchase is Dedicated to GouSeva</h2>
          <p className="mt-4 leading-relaxed text-cream/90">
            With every purchase of <strong>our products</strong>, you are not just bringing purity into your home, but also supporting <strong>GouSeva</strong>.
            Your contribution helps in the service and care of cows, continuing the sacred tradition. 🌿🐄
          </p>
          <Link href="/mission" className="btn-accent mt-6">Our mission</Link>
        </div>
        <img src={IMG.community} alt="Community gathered on the goshala grounds" loading="lazy" className="w-full rounded-2xl object-cover" />
      </section>

      {/* Trust */}
      <section className="container-x mt-24 grid items-center gap-10 md:grid-cols-[1fr_2fr]">
        <div className="text-center md:text-left">
          <p className="font-serif text-7xl font-bold text-saffron">14783+</p>
          <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em]">Trusted by Many</p>
        </div>
        <figure className="card p-8">
          <div className="mb-3 text-saffron" aria-label="5 out of 5 stars">★★★★★</div>
          <blockquote className="font-serif text-2xl leading-snug text-leaf-dark">
            “The products from Shri Shiva Sadguru Goshala have transformed my spiritual practices. I feel a deep connection to tradition and purity with every purchase.”
          </blockquote>
          <figcaption className="mt-4 text-sm font-bold">Ananya Rao</figcaption>
        </figure>
      </section>
    </>
  );
}
