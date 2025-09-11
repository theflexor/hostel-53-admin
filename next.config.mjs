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
}

export default nextConfig
