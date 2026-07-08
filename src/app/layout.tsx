import type { Metadata } from 'next'
import { Geist, Geist_Mono, Manrope, Space_Grotesk } from 'next/font/google'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { PlanTracker } from '@/components/onboarding/plan-tracker'
// import { PlanWidget } from '@/components/onboarding/plan-widget' // hidden for now
import { CompanionWidget } from '@/components/companion/companion-widget'
import { SoundToggle } from '@/components/homepage/sound-toggle'
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
    default: `${SITE.name} — ${SITE.tagline}`,
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
  openGraph: {
    type: 'website',
    locale: 'en_NZ',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
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
