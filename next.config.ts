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
  /**
   * Send the production *.vercel.app hosts to the real domain.
   *
   * Without this the site answers on both, and whichever one you happen to be
   * on becomes your origin for everything that is origin-scoped. Web Push is
   * the visible case: a notification is labelled with the origin of the service
   * worker that registered it, so a phone that subscribed on the Vercel URL
   * shows "vercel.app" on every alert instead of arapono.org.nz. The same split
   * affects the service worker itself, localStorage, and the auth cookie — one
   * person can end up with two of each without ever noticing.
   *
   * Preview deployments are deliberately exempt: VERCEL_ENV is 'preview' for
   * those, and redirecting them to production would make every branch preview
   * useless. This is evaluated at build time, so each deployment bakes in the
   * right answer for itself.
   *
   * 307 rather than 308 on purpose. A permanent redirect is cached hard by
   * browsers and would be painful to walk back if the Vercel host is ever
   * needed for debugging. Canonical tags and the sitemap already point search
   * engines at arapono.org.nz, so nothing is lost by keeping this reversible.
   */
  async redirects() {
    if (process.env.VERCEL_ENV !== 'production') return []
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '(.*)\\.vercel\\.app' }],
        destination: 'https://arapono.org.nz/:path*',
        permanent: false,
      },
    ]
  },

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
