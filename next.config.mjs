/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger file uploads (up to 10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
