import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external domains (QR code APIs)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'qr.sepay.vn' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
};

export default nextConfig;
