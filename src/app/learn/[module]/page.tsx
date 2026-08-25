/**
 * /learn/[module] — a single interactive learning module.
 * Server shell (header, metadata, static params) wrapping the client experience.
 *
 * Gutters and heading follow the site's clamp() scale, as on /learn. Both pages
 * were written with a fixed 36px gutter and a fixed heading size, which on a
 * 360px phone spent a fifth of the width on margins.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getModule, LEARN_MODULE_IDS } from '@/constants/learn-data'
import { learnTheme } from '@/constants/learn-theme'
import { SectionDivider } from '@/components/ui/section-divider'
import { ModuleExperience } from '@/components/learn/module-experience'
import { BORDER, INK, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export function generateStaticParams() {
  return LEARN_MODULE_IDS.map((module) => ({ module }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ module: string }> },
): Promise<Metadata> {
  const { module } = await params
  const m = getModule(module)
  if (!m) return { title: 'Module not found' }
  return { title: `${m.title} · Learn`, description: m.subtitle }
}

export default async function LearnModulePage(
  { params }: { params: Promise<{ module: string }> },
) {
  const { module } = await params
  const m = getModule(module)
  if (!m || m.status !== 'live') notFound()
  const theme = learnTheme(module)

  return (
    <div style={WOVEN_PAGE}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) clamp(24px, 4vh, 34px)' }}>
          <Link href="/learn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 20 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All modules
          </Link>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Interactive Lesson" />
          </div>
          {/* The module's own colour follows from the hub card that was tapped:
              an accent bar beside the heading, the same ink the card wore. Kept
              to an accent rather than a filled band — this page is a lesson,
              and a page of reading on a tinted ground tires faster than white. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
            <span aria-hidden style={{ alignSelf: 'stretch', width: 5, borderRadius: 99, background: theme.ink, flexShrink: 0 }} />
            <div>
              <h1 style={{ fontSize: 'clamp(24px, 6.5vw, 34px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.1 }}>{m.title}</h1>
              <p style={{ fontSize: 'clamp(14px, 3.8vw, 16px)', fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>{m.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(22px, 3.5vh, 30px) clamp(18px, 5vw, 36px) 64px' }}>
        <ModuleExperience module={m} />

        <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 36, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Sources" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Based on civics material from parliament.nz and the Electoral Commission (elections.nz). Non-partisan and free to use.
          </p>
        </div>
      </div>
    </div>
  )
}
