/** @type {import('next').NextConfig} */
const nextConfig = {
  // assetPrefix: "/hostel-admin/",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable standalone output for Docker
  output: "standalone",
}

export default nextConfig
