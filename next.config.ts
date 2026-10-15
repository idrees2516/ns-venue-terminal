import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // the old monolithic /trade terminal page was split into sections — send
  // any bookmark straight to the order book focus page
  async redirects() {
    return [{ source: "/trade", destination: "/orderbook", permanent: false }];
  },
};

export default nextConfig;
