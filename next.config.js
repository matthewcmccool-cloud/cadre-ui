/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@clerk/nextjs', '@clerk/shared', '@clerk/backend'],
      swcMinify: false,
}

module.exports = nextConfig
