/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@clerk/nextjs', '@clerk/shared', '@clerk/backend'],
      swcMinify: true,
}

module.exports = nextConfig
