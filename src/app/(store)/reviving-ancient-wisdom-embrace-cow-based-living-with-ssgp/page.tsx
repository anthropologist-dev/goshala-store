import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { IMG } from "@/lib/images";

export const metadata = { title: "Reviving Ancient Wisdom: Embrace Cow-Based Living with SSGP" };

export default function BlogPost() {
  return (
    <>
      <PageHero eyebrow="Journal" title="Reviving Ancient Wisdom: Embrace Cow-Based Living" image={IMG.blogHero} />
      <article className="container-x prose-store mt-14 max-w-3xl">
        <p>
          For generations, Indian households have lived alongside the native cow, drawing on her gifts for worship, health and the
          home. Cow-based living brings that wisdom back into everyday life, joining spiritual tradition with care for the environment.
        </p>
        <p>
          Our pooja essentials are made from the by-products of native cows and are free from chemicals, a natural alternative to
          the synthetic products that fill most homes today. Each one is a small way to reconnect with heritage.
        </p>
        <h2>Start with one small change</h2>
        <p>
          Swap a chemical cleaner for TaamraGoura, light Pushpaka Vimana dhoop for your evening prayer, or clean your floors with Gomaya
          powder. Every purchase also supports GouSeva at our goshala.
        </p>
        <Link href="/products" className="btn-primary">Browse products</Link>
      </article>
    </>
  );
}
