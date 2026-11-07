import { PageHero } from "@/components/page-hero";
export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <>
      <PageHero title="Privacy Policy" />
      <article className="container-x prose-store mt-12 max-w-3xl">
        <h2>What we collect</h2>
        <p>When you place an order we collect your name, phone number, delivery address, optional email and payment reference. When you send an inquiry we collect your email and message.</p>
        <h2>How we use it</h2>
        <ul>
          <li>To process, ship and support your order</li>
          <li>To issue invoices and meet our legal and tax obligations</li>
          <li>To reply to your questions</li>
        </ul>
        <h2>Sharing</h2>
        <p>We share your delivery details only with the courier or postal service delivering your order. We do not sell your data.</p>
        <h2>Payments</h2>
        <p>UPI payments are made directly from your UPI app to our account. We never see or store your bank or card details.</p>
        <h2>Your choices</h2>
        <p>To see, correct or delete your information, email <a className="underline" href="mailto:ssgkadatoka@gmail.com">ssgkadatoka@gmail.com</a>. Order records may be kept as long as tax law requires.</p>
      </article>
    </>
  );
}
