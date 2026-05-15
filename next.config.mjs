/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

// CSP with conditional unsafe-eval for development (Next.js SWC needs it)
const isDev = process.env.NODE_ENV !== 'production';
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' ${isDev ? "'unsafe-eval'" : "'wasm-unsafe-eval'"} 'unsafe-inline' https://www.googletagmanager.com https://www.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://adservice.google.com https://partner.googleadservices.com https://www.googlesyndication.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
  img-src 'self' blob: data: https://www.googletagmanager.com https://www.google.com https://www.google-analytics.com https://fonts.gstatic.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://adservice.google.com https://partner.googleadservices.com https://www.googlesyndication.com;
  font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net;
  connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://adservice.google.com https://partner.googleadservices.com https://cdn.jsdelivr.net https://emkc.org https://integrate.api.nvidia.com;
  worker-src 'self' blob: https://cdn.jsdelivr.net;
  frame-src 'self' https://www.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://partner.googleadservices.com https://adservice.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\n/g, '');

const nextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy,
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },

  // Enable strict mode for better development practices
  reactStrictMode: true,

  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Packages that should not be bundled and should be kept as external
  serverExternalPackages: ['@upstash/redis', 'openai'],
};

export default nextConfig;
