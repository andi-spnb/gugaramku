/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aktifkan strict mode untuk React
  reactStrictMode: true,

  // Konfigurasi gambar
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.gugaramku.com',
      },
    ],
    // Format gambar yang didukung
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features
  experimental: {
    // Optimasi untuk server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Headers keamanan
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirect rules
  async redirects() {
    return [
      {
        source: '/',
        destination: '/kasir',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
