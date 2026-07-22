import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
  experimental: {
    // Default is 1MB — too small for mobile photo uploads on /feedback.
    // Bumping to 10MB keeps room for the 5MB per-avatar cap + form overhead.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/:path*",
        destination: "/api/well-known/:path*",
      },
      {
        source: "/cv",
        destination:
          "https://tnjujbkpepchhgyqwmtb.supabase.co/storage/v1/object/public/resumes/public/LinZhenming_Resume.pdf",
      },
      {
        source: "/resume",
        destination:
          "https://tnjujbkpepchhgyqwmtb.supabase.co/storage/v1/object/public/resumes/public/LinZhenming_Resume.pdf",
      },
    ];
  },
};

export default nextConfig;
