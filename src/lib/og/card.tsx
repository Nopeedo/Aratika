/**
 * og/card.tsx — the shared Open Graph card.
 *
 * Every page on the site shared as an identical bare text link: no image at all,
 * and one title ("Arapono — Navigating New Zealand Politics") for the homepage,
 * the Housing comparison and the battlegrounds map alike. Nothing gave anyone a
 * reason to tap, and `twitter:card: summary_large_image` was declared with no
 * image to fill it, so it silently degraded to the plain card.
 *
 * One renderer rather than a layout per route, so the cards read as a set: warm
 * paper ground, espresso ink, an accent rule that carries the party or topic
 * colour, and the wordmark bottom-left. Anything route-specific is passed in.
 *
 * Fonts are read from src/assets/fonts rather than fetched from Google at render
 * time — the card must not depend on a third party being reachable, and the
 * renderer behind ImageResponse does not accept woff2.
 */

import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const INK = '#2A1206'
const PAPER = '#F4F2EC'
const SECONDARY = '#6B6157'
const TERTIARY = '#9A9186'
const JADE = '#1F8A4C'

async function fonts() {
  const dir = join(process.cwd(), 'src/assets/fonts')
  const [bold, extra] = await Promise.all([
    readFile(join(dir, 'Manrope-Bold.ttf')),
    readFile(join(dir, 'Manrope-ExtraBold.ttf')),
  ])
  return [
    { name: 'Manrope', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Manrope', data: extra, weight: 800 as const, style: 'normal' as const },
  ]
}

export interface CardProps {
  /** Small uppercase label above the title — the section this page belongs to. */
  eyebrow: string
  title: string
  /** One line under the title. Keep it short; it is truncated by the layout. */
  subtitle?: string
  /** A single number worth leading with, e.g. a majority or a party count. */
  stat?: { value: string; label: string }
  /** Party or topic colour for the rule and eyebrow. Defaults to the brand. */
  accent?: string
}

export async function ogCard({ eyebrow, title, subtitle, stat, accent = JADE }: CardProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: PAPER, padding: '64px 72px', position: 'relative',
          fontFamily: 'Manrope',
        }}
      >
        {/* Accent rule across the top — the one element that changes per page. */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: accent, display: 'flex' }} />

        <div style={{ display: 'flex', fontSize: 24, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: accent }}>
          {eyebrow}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', marginTop: -20 }}>
          <div style={{ display: 'flex', fontSize: title.length > 46 ? 62 : 78, fontWeight: 800, color: INK, lineHeight: 1.08, letterSpacing: -2 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: SECONDARY, marginTop: 22, lineHeight: 1.3 }}>
              {subtitle}
            </div>
          )}
          {stat && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 26 }}>
              <div style={{ display: 'flex', fontSize: 88, fontWeight: 800, color: accent, letterSpacing: -3 }}>{stat.value}</div>
              <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: SECONDARY }}>{stat.label}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: INK }}>Arapono</div>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: TERTIARY }}>
            arapono.org.nz · non-partisan, sourced
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  )
}
