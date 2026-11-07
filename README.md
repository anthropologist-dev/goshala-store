# Sri Shivasadguru Goshala store

Storefront and admin for srishivasadgurugoshala.com, replacing the Hostinger site.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · PostgreSQL

## What's in it

**Store** (same pages and URLs as the current site)
- Home, About Us, Products, Mission, the journal post, Terms, Privacy, Shipping & Refund
- Product pages with pack sizes, stock status, features and usage steps
- Old Hostinger URLs (`/tamaragaoura`, `/pushpaka-vimana`, `/gomaya-powder`) redirect permanently to the new product pages
- Cart (kept in the browser), checkout with live price/stock re-check
- Free shipping above ₹500, flat fee below (both editable)
- **UPI**: order page shows a QR and a "pay with UPI app" link for the exact amount; the customer submits their UTR
- **Cash on Delivery**, with an optional COD charge
- Order tracking by order number + mobile number
- Inquiry form in the footer

**Admin** (`/admin`, mobile-first with a bottom tab bar on phones)
- **Dashboard**: revenue, orders, average order value, items sold, daily revenue chart (7d/30d/90d/1y), top products, payment split, top states, to-do counts and low-stock list
- **Orders**: filters (new, verify UPI, to ship, shipped…), search, CSV export, status flow Placed → Confirmed → Packed → Shipped → Delivered, cancel/return (stock goes back automatically), "Payment received" for UPI, WhatsApp-the-customer button, internal notes
- **Shipping**: carrier, tracking number/link, parcel weight, cost paid; printable 4×6 shipping label PDF (shows "COD: COLLECT ₹…" when relevant)
- **Invoices**: issued automatically when an order is confirmed, gap-free numbering per financial year (`SSG/26-27/0001`), PDF with CGST+SGST (Karnataka buyers) or IGST (other states), HSN per product
- **Products & inventory**: create/edit products and pack sizes, show/hide, feature on home page, restock / damage / correction with a full stock log, low-stock alerts; stock is reserved at checkout and overselling is blocked even with simultaneous orders
- **Settings**: UPI ID, GSTIN, address, invoice prefix, shipping rules, COD on/off, admin password

## Run locally

```bash
cp .env.example .env        # fill in DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run setup               # creates tables, loads products, creates the admin login
npm run dev                 # http://localhost:3000, admin at /admin
```

## Deploy on Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, pick the repo. `render.yaml` creates the web service and a Postgres database.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` when prompted. Migrations and seeding run on every deploy (seeding never overwrites existing data).
4. Log in at `/admin` → **Settings**: add your **UPI ID** (UPI is hidden at checkout until you do), GSTIN if registered, and check the address.
5. Point `www.srishivasadgurugoshala.com` at the Render service (Render → Settings → Custom domains), then update DNS at Hostinger.

## Before going live

- **Prices and stock**: the three live products are loaded at their current prices (₹125, ₹125, ₹100) with 50 units each. Set real stock in Admin → Inventory.
- **Draft products**: Gorakshakavacha, Agnihotra Bherani and Pradhana Dhoopa are listed on your Mission page but had no product pages, so they're loaded hidden. Add price, stock, photos and text, then tick "Visible in store".
- **GST**: every product starts at 0% with no HSN. Set the correct HSN code and rate per product; prices are treated as GST-inclusive. Shipping and COD charges are shown untaxed on invoices.
- **Images** still load from Hostinger's CDN (`src/lib/images.ts` and product image URLs). Download them into `public/` or your own storage before cancelling Hostinger.
- **Policy pages** are rewritten from your current site. The current refund page says both "no refunds" (in its metadata) and describes a refund process; confirm which you want.
- **Phone numbers**: the footer shows +91 94488 52888 and +91 99165 64986. Your current site's phone links don't match their labels (one dials 9429690366), so check these.
- Pushpaka Vimana's "How to use" steps were written generically because the current page has none.

## Project layout

```
src/app/(store)/      storefront pages
src/app/admin/        admin pages and server actions (actions.ts)
src/app/api/          checkout, cart refresh, invoice/label PDFs, CSV export
src/db/schema.ts      database tables
src/lib/orders.ts     checkout, stock, status flow, invoice numbering, GST split
src/lib/analytics.ts  dashboard queries
scripts/              migrate and seed
drizzle/              SQL migrations (regenerate with `npm run db:generate` after schema changes)
```
