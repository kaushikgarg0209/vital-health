import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* API requests are proxied via src/app/api/v1/[...path]/route.ts */
  // Dev server binds to localhost:3000 but auth redirects use 127.0.0.1:3000
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
