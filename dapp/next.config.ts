import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws", "@solana/web3.js"],
};

export default nextConfig;
