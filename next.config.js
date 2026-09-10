/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: false,
    domains: [],
  },
  env: {
    SITE_NAME: 'SEVENTHWEAR',
    SITE_URL: 'https://www.seventhwear.com',
  },
};

module.exports = nextConfig;
