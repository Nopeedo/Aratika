import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Geist, Geist_Mono, Manrope, Space_Grotesk } from 'next/font/google'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { PlanTracker } from '@/components/onboarding/plan-tracker'
// import { PlanWidget } from '@/components/onboarding/plan-widget' // hidden for now
import { CompanionWidget } from '@/components/companion/companion-widget'
import { SoundToggle } from '@/components/homepage/sound-toggle'
import { SWRegister } from '@/components/notifications/sw-register'
import { NavHistory } from '@/components/ui/nav-history'
import { RouteProgress } from '@/components/ui/route-progress'
import { OrganizationSchema } from '@/components/seo/organization-schema'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { SITE } from '@/constants/site'
import './globals.css'

// ─── Fonts ────────────────────────────────────────────────────────────────────

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Manrope — used for the parliament dashboard UI labels and body text
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

// Space Grotesk — used for large display numerals (seat counts, coalition totals)
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
})

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: `${SITE.name}: ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    'New Zealand politics',
    'NZ parliament',
    'MPs',
    'political parties',
    'legislation',
    'bills',
    'elections',
    'policies',
    'Aotearoa',
  ],
  authors: [{ name: SITE.name }],
  metadataBase: new URL(SITE.url),
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: SITE.name },
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // NO title/description here. A literal openGraph.title in the root overrides
  // every page's own, so sharing the Housing comparison, the Election Centre and
  // the battlegrounds map all produced the identical card — one title, one
  // description, nothing to tell them apart. Left unset, Next falls back to each
  // page's `title` and `description`, which every page already defines.
  openGraph: {
    type: 'website',
    locale: 'en_NZ',
    url: SITE.url,
    siteName: SITE.name,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
}

// Locks pinch-zoom (userScalable: false / maximumScale: 1) — the fixed bottom
// tile dock and navbar are sized for a fixed viewport; letting mobile Safari/
// Chrome zoom in/out was part of what made the page feel like it was
// "glitching" and shifting around.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1F8A4C',
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-NZ"
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        ${manrope.variable}
        ${spaceGrotesk.variable}
        h-full antialiased
      `}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <OrganizationSchema />
        <SWRegister />
        {/* Every route takes 0.8-2.3s to first byte and the App Router keeps the
            old page on screen meanwhile, so without this a click looked like it
            had missed. Readers were clicking twice. */}
        <Suspense fallback={null}><RouteProgress /></Suspense>
        {/* Records the previous in-app route so BackLink can return you to where
            you actually came from rather than a page's fixed parent. */}
        <NavHistory />
        <Navbar />
        <PlanTracker />
        <main className="flex-1">{children}</main>
        {/* Plan feature hidden for now — restore this to bring back the floating checklist. */}
        {/* <PlanWidget /> */}
        <CompanionWidget />
        <SoundToggle />
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
