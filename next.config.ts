import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/api/images/**"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/api/images/**"
      },
      {
        protocol: "https",
        hostname: "songwriting-dashboard.dpbednarczyk.workers.dev",
        pathname: "/api/images/**"
      }
    ]
  }
};

export default nextConfig;
