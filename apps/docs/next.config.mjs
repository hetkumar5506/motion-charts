/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "motion-charts";
const basePath = isGitHubPages ? `/${repositoryName}` : "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  transpilePackages: ["@motion-charts/core"],
  allowedDevOrigins: ["*.e2b.app", "3000-ijk1osxr64w7cj88px8jq.e2b.app"],
  experimental: {
    optimizePackageImports: ["@motion-charts/core"]
  }
};

export default nextConfig;
