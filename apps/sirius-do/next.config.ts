import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@workspace/ui", "@workspace/sirius-core"],
};

export default nextConfig;
