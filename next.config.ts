import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/city/submissions/aips/:aipId",
        destination: "/city/submissions/aip/:aipId",
      },
    ];
  },
};

export default nextConfig;
