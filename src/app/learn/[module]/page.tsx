/**
 * /learn/[module] — a single interactive learning module.
 * Server shell (header, metadata, static params) wrapping the client experience.
 *
 * Gutters and heading follow the site's clamp() scale, as on /learn.
 *
 * The header arrives the way /bills' header arrives (src/app/bills/page.tsx):
 * title, one (i), and nothing else. What came off it, and why:
 *
 * - The "Interactive Lesson" badge (§1.3). The page named itself twice above
 *   the fold, in the badge and in the h1 under it, and SectionDivider's
 *   "official" variant is this site's credibility marker for verified external
 *   data. These are lessons we wrote. /bills dropped its "Official Parliament
 *   Data" badge for exactly that reason.
 * - The whole Sources footer (§1.8, §1.2). "Based on civics material from
 *   parliament.nz and the Electoral Commission" is a page-level line that
 *   evidenced none of the figures above it. It is now the first section of the
 *   (i), with the specific source named against the specific numbers, and each
 *   widget's own (i) carries the citation for the figures it draws.
 * - The 38px back row. Still there, as a chip: one tap out of a lesson is worth
 *   keeping, a row of its own is not.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getModule, LEARN_MODULE_IDS } from '@/constants/learn-data'
import { learnTheme } from '@/constants/learn-theme'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
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
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px) clamp(20px, 3.5vh, 28px)' }}>
          {/* A chip, not a row. It was a 38px line with 20px under it before
              the page had said what it was about. */}
          <Link href="/learn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, border: `1px solid ${BORDER}`, background: '#fff', borderRadius: 999, padding: '4px 11px 4px 9px', marginBottom: 13 }}>
            <ArrowLeft style={{ width: 13, height: 13 }} /> All modules
          </Link>
          {/* The module's own colour follows from the hub card that was tapped:
              an accent bar beside the heading, the same ink the card wore. Kept
              to an accent rather than a filled band — this page is a lesson,
              and a page of reading on a tinted ground tires faster than white.
              Since the tier colours were contained to the tier pills (§1.6),
              this is the only accent on the page, and everything below it
              follows the same hue. */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
            <span aria-hidden style={{ alignSelf: 'stretch', width: 5, borderRadius: 99, background: theme.ink, flexShrink: 0 }} />
            <div>
              {/* Not wrapped: the (i) keeps its place beside the title and the
                  TITLE takes the shrinking. Ten module names run from "Who does
                  what" to "Having your say between elections", and on a wrapping
                  row the long ones pushed the (i) onto a 28px line of its own. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <h1 style={{ flex: '1 1 auto', minWidth: 0, fontSize: 'clamp(24px, 6.5vw, 34px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.1 }}>{m.title}</h1>
                {/* 28 beside an h1, 24 beside a section heading: the sizes
                    /bills uses for the same two positions (§2.1). */}
                <AboutThisLesson accent={theme.ink} />
              </div>
              <p style={{ fontSize: 'clamp(14px, 3.8vw, 16px)', fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '6px 0 0' }}>{m.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(22px, 3.5vh, 30px) clamp(18px, 5vw, 36px) 64px' }}>
        <ModuleExperience module={m} />
      </div>
    </div>
  )
}

/**
 * §2.1. What the Sources footer used to say, plus the thing it never said:
 * which figures on the page are the official 2023 result and who published
 * them. §1.8 is "sourced or it goes", and a page-level "based on civics
 * material" evidences nothing in particular.
 */
function AboutThisLesson({ accent }: { accent: string }) {
  return (
    <InfoButton accent={accent} label="Where this lesson comes from" size={28}>
      <InfoHeading accent={accent}>Where this comes from</InfoHeading>
      <InfoText>
        Written from the civics material published by Parliament (parliament.nz) and the
        Electoral Commission (elections.nz). Non-partisan, and free to use.
      </InfoText>
      <InfoHeading accent={accent}>The seat numbers</InfoHeading>
      <InfoText>
        Every seat count on this page is the official result of the 2023 general election,
        as declared by the Electoral Commission. Each widget says which House it is
        modelling, because they are not all the same size.
      </InfoText>
      <InfoHeading accent={accent}>Four levels</InfoHeading>
      <InfoText>
        The same subject is written four times over, from Kids to Expert. The facts do not
        change between levels, the amount of detail does.
      </InfoText>
    </InfoButton>
  )
}
