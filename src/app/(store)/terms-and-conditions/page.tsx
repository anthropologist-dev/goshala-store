import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Terms and Conditions" };

export default function Terms() {
  return (
    <>
      <PageHero title="Terms and Conditions" />
      <article className="container-x prose-store mt-12 max-w-3xl">
        <p>This website is operated by Sri Shivasadguru Gavyodyama (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using it you accept these terms.</p>
        <h2>Cookies</h2>
        <p>We use cookies that are needed for the site and your cart to work. Optional cookies for statistics or marketing are used only if you accept them.</p>
        <h2>Intellectual property</h2>
        <p>All content on this site belongs to us or our licensors. You may view it for personal use, but may not copy, republish, sell or redistribute it.</p>
        <h2>Orders and payment</h2>
        <p>All prices are in Indian Rupees and include applicable taxes. An order is confirmed once payment is verified (UPI) or the order is accepted for Cash on Delivery. We may cancel an order if a product becomes unavailable, and will refund any payment received.</p>
        <h2>Comments and links</h2>
        <p>We may remove any comment we consider inappropriate. Organisations wishing to link to this site should email us first; our logo may not be used without permission.</p>
        <h2>Accuracy and liability</h2>
        <p>We work to keep information accurate but cannot guarantee it is always complete or current. To the extent permitted by law, we exclude warranties and liability for use of this site, except for liability that cannot be excluded by law.</p>
        <h2>Changes</h2>
        <p>We may update these terms at any time. Questions: <a className="underline" href="mailto:ssgkadatoka@gmail.com">ssgkadatoka@gmail.com</a>.</p>
      </article>
    </>
  );
}
