/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@motion-charts/core"],
  allowedDevOrigins: ["*.e2b.app", "3000-ijk1osxr64w7cj88px8jq.e2b.app"],
  experimental: {
    optimizePackageImports: ["@motion-charts/core"]
  }
};

export default nextConfig;
