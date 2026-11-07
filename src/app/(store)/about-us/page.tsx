import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { IMG } from "@/lib/images";

export const metadata = { title: "Learn More about us - Shri Shivasadguru Gavyodyama" };

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Us" title="Honouring Goumatha through pure, cow-based living" image={IMG.aboutCow} />
      <div className="container-x mt-14 grid gap-12 md:grid-cols-2">
        <div className="prose-store">
          <p>
            Sri Shivasadguru Goushala (Gavyodyama) honours the cow as <em>Goumatha</em>. Our work centres on the native
            <strong> Malnad Gidda</strong> breed, whose milk, gomutra and gomaya become the base of every formulation we make.
          </p>
          <p>
            Everything we offer is free from chemicals and adulteration. Ingredients come from our own shelters and certified organic
            partners, and products are made in GMP-certified facilities.
          </p>
          <h2>Donation-free, by design</h2>
          <p>
            We don&apos;t ask for donations. The goshala is sustained by product sales, and profits go back into new cow shelters,
            veterinary care, community programmes and skill-building for women.
          </p>
          <h2>Rooted in the village</h2>
          <p>
            Our work creates steady rural employment, especially for women, and we openly share what we learn so other goshalas can
            follow the same self-reliant model.
          </p>
          <Link href="/products" className="btn-primary mt-2">Explore our products</Link>
        </div>
        <div className="space-y-6">
          <img src={IMG.heroCow} alt="Malnad Gidda cow" className="w-full rounded-3xl object-cover shadow-lg" />
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="card p-6"><p className="font-serif text-5xl font-bold text-saffron">8+</p><p className="mt-1 text-xs font-bold uppercase tracking-widest">Pure Products</p></div>
            <div className="card p-6"><p className="font-serif text-5xl font-bold text-saffron">14783+</p><p className="mt-1 text-xs font-bold uppercase tracking-widest">Trusted by Many</p></div>
          </div>
        </div>
      </div>
    </>
  );
}
