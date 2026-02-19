import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid workspace root mis-detection that can cause
    // "Next.js package not found" panics on dev.
    root: process.cwd(),
  },
};

export default nextConfig;
