import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { IMG } from "@/lib/images";

export const metadata = { title: "Our Mission" };

const GOALS = [
  ["1,000 desi cows", "Establish a model goshala for 1,000 desi cows within 3 years."],
  ["10,000 by Year 10", "Grow capacity to 10,000 desi cows by the tenth year."],
  ["Self-reliant", "Run entirely on revenue from Gavyodyama products, not on donations."],
  ["Rural livelihoods", "Provide steady employment to rural families, prioritising women."],
  ["A blueprint", "Serve as a model for ethical goshala ventures across India."],
];

const PRODUCTS = ["Taamragoura", "Pushpakavimana", "Gomaya Powder", "Gorakshakavacha", "Agnihotra Bherani", "Pradhana Dhoopa"];

export default function MissionPage() {
  return (
    <>
      <PageHero eyebrow="Mission" title="Eco-conscious living, rooted in ancient tradition" image={IMG.community} />
      <div className="container-x mt-14">
        <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed">
          We promote a chemical-free, sustainable way of life through cow-based products, reconnecting people with traditions that
          care for the earth.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {GOALS.map(([t, d], i) => (
            <div key={t} className="card p-6">
              <p className="font-serif text-4xl font-bold text-saffron">{i + 1}</p>
              <h3 className="mt-2 text-xl">{t}</h3>
              <p className="mt-2 text-sm text-earth-light">{d}</p>
            </div>
          ))}
        </div>
        <section className="mt-16 rounded-3xl bg-leaf p-8 text-cream sm:p-12">
          <h2 className="text-3xl text-cream">Our Gavyodyama products</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {PRODUCTS.map((p) => <span key={p} className="rounded-full bg-cream/10 px-4 py-2 text-sm font-semibold">{p}</span>)}
          </div>
          <h2 className="mt-10 text-3xl text-cream">How you can be part of it</h2>
          <p className="mt-3 text-cream/90">Buy our products, visit the goshala, volunteer with us, or subscribe for impact updates.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className="btn-accent">Shop products</Link>
            <a href="https://wa.me/message/BK7XX4AKEUYVB1" target="_blank" rel="noopener noreferrer" className="btn border border-cream/60 text-cream hover:bg-cream hover:text-leaf-dark">Plan a visit</a>
          </div>
        </section>
      </div>
    </>
  );
}
