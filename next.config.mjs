/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfkit", "pg"],
  eslint: { ignoreDuringBuilds: true },
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
