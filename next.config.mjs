/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit", "pg"],
  eslint: { ignoreDuringBuilds: true },
  // PDFKit reads its built-in font metrics from disk at runtime; make sure serverless bundles include them.
  outputFileTracingIncludes: {
    "/api/admin/invoice/[orderId]": ["./node_modules/pdfkit/js/data/**/*"],
  },
  async redirects() {
    // Keep the old Hostinger product URLs working
    return [
      { source: "/tamaragaoura", destination: "/products/tamaragaoura", permanent: true },
      { source: "/pushpaka-vimana", destination: "/products/pushpaka-vimana", permanent: true },
      { source: "/gomaya-powder", destination: "/products/gomaya-powder", permanent: true },
    ];
  },
};
export default nextConfig;
