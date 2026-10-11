// @ts-nocheck
// next.config.ts

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {

  images: {
    // `domains` is deprecated in Next.js 15 — use remotePatterns only.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eikon.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            // Removed 'unsafe-eval' — Next.js 15 App Router does not need it in
            // production.  'unsafe-inline' is still required for Tailwind's runtime
            // style injection; use nonce-based CSP in a future hardening pass to
            // eliminate that too.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com",
              [
                "connect-src 'self'",
                'https://*.supabase.co',
                'wss://*.supabase.co',
                'https://api.resend.com',
                'https://api.paystack.co',
                'https://api.flutterwave.com',
                'https://api-m.paypal.com',
              ].join(' '),
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
