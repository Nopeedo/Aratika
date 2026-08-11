import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Vercel already sets HSTS on production domains, so that one isn't repeated
 * here. The four below are the ones nothing was sending: without frame-ancestors
 * the signed-in dashboard and /editor were framable (clickjacking), and without
 * a referrer policy full URLs leaked to every outbound link.
 *
 * CSP is deliberately Report-Only for now. This site loads Google Identity,
 * Stripe, Sentry, Vercel Analytics, Supabase, YouTube embeds and Carto map
 * tiles; a blocking policy that misses one of them breaks sign-in or payments
 * in production, and the origin list can't be fully verified at build time.
 * Report-Only gives the violation reports needed to tighten it safely — promote
 * it to `Content-Security-Policy` once the reports come back clean.
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // Next injects inline bootstrap scripts; 'unsafe-inline' is required until
  // nonces are wired through. This is exactly why it stays Report-Only.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://js.stripe.com https://*.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.sentry.io https://nominatim.openstreetmap.org https://*.basemaps.cartocdn.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://accounts.google.com https://js.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
        ],
      },
    ]
  },
};

export default nextConfig;
