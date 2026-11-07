export function PageHero({ eyebrow, title, image }: { eyebrow?: string; title: string; image?: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-leaf-dark">
      {image && <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />}
      <div className="container-x py-20 text-center">
        {eyebrow && <p className="eyebrow mb-3 text-saffron-light">{eyebrow}</p>}
        <h1 className="mx-auto max-w-3xl text-4xl text-cream sm:text-5xl">{title}</h1>
      </div>
    </section>
  );
}
