/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@clerk/nextjs', '@clerk/shared', '@clerk/backend'],
    swcMinify: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'www.google.com' },
            { protocol: 'https', hostname: '**.googleusercontent.com' },
            { protocol: 'https', hostname: '**.airtableusercontent.com' },
            { protocol: 'https', hostname: '**.clearbit.com' },
        ],
    },
    async redirects() {
        return [
            // Legacy homepage tab params → /discover
            {
                source: '/',
                has: [{ type: 'query', key: 'tab', value: 'companies' }],
                destination: '/discover?view=companies',
                permanent: true,
            },
            {
                source: '/',
                has: [{ type: 'query', key: 'tab', value: 'investors' }],
                destination: '/discover?view=investors',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://*.clerk.accounts.dev",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob: https: http:",
                            "font-src 'self' data:",
                            "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://plausible.io https://api.stripe.com https://app.loops.so https://*.supabase.co",
                            "frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com",
                            "worker-src 'self' blob:",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
}

module.exports = nextConfig
