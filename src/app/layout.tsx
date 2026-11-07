import type { Metadata, Viewport } from "next";
import "./globals.css";
import { IMG } from "@/lib/images";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.srishivasadgurugoshala.com";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Revive Tradition with Eco-Friendly Cow Products | Sri Shivasadguru Gavyodyama",
    template: "%s | Sri Shivasadguru Gavyodyama",
  },
  description:
    "Sacred cow-based products from Sri Shivasadguru Goshala: TaamraGoura, Gomaya, Pushpaka Vimana and more, made from native Malnad Gidda cows with purity and Vedic wisdom.",
  keywords: ["cow products", "eco-friendly", "spiritual lifestyle", "gau seva", "dhoop", "panchagavya"],
  openGraph: { siteName: "Sri Shivasadguru Gavyodyama", type: "website", images: [IMG.logo] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#2E4B2C", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Mulish:wght@400;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
