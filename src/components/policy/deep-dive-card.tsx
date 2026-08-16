/**
 * DeepDiveCard — the entry point to one long-form policy breakdown.
 *
 * Deep dives outgrew the page they were born on. A single one runs to roughly
 * ten phone screens, and TOP's economy page carried three: about thirty-three.
 * So the breakdown moved to /policies/[topic]/[party]/[slug] and this card
 * stands in its place.
 *
 * The card has to do real work, not just be a link. A reader who stops here
 * should still come away with the party's own summary, the headline numbers and
 * an honest sense of how much sits behind it — which is what the section count
 * and the open-question count are for. Volume is the thing we're managing; the
 * counts let a reader choose it rather than be handed it.
 */

import Link from 'next/link'
import { ScrollText, ArrowRight } from 'lucide-react'
import type { PolicyDeepDive as DeepDive } from '@/constants/policy-deep-dives'
import { BORDER, INK, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

const CARD_CSS = `
.ddc { display: block; text-decoration: none; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
.ddc:hover { box-shadow: 0 6px 20px rgba(15, 23, 42, .07); transform: translateY(-1px); }
.ddc:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.ddc-summary { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.ddc-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 8px; }
.ddc-cta { display: inline-flex; align-items: center; gap: 6px; }
.ddc:hover .ddc-cta-arrow { transform: translateX(2px); }
.ddc-cta-arrow { transition: transform .15s ease; }
@media (prefers-reduced-motion: reduce) {
  .ddc, .ddc-cta-arrow { transition: none; }
  .ddc:hover { transform: none; }
}
`

export function DeepDiveCard({
  dive,
  accent,
  partyName,
  topic,
}: {
  dive: DeepDive
  accent: string
  partyName: string
  topic: string
}) {
  // Three is what fits on one row at the narrowest width without wrapping to a
  // second, which would start rebuilding the volume this card exists to cut.
  const facts = dive.facts.slice(0, 3)

  const meta = [
    `${dive.mechanics.length} section${dive.mechanics.length === 1 ? '' : 's'}`,
    dive.examples.length > 0 ? `${dive.examples.length} worked example${dive.examples.length === 1 ? '' : 's'}` : null,
    `${dive.quotes.length} quote${dive.quotes.length === 1 ? '' : 's'}`,
    `${dive.openQuestions.length} open question${dive.openQuestions.length === 1 ? '' : 's'}`,
  ].filter(Boolean) as string[]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CARD_CSS }} />
      <Link
        href={`/policies/${topic}/${dive.party}/${dive.slug}`}
        className="ddc"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderLeft: `4px solid ${accent}`,
          borderRadius: 18,
          padding: 'clamp(16px, 3.5vw, 24px)',
          color: INK,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
          <ScrollText style={{ width: 15, height: 15, color: accent, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: SECONDARY, fontFamily: MANROPE }}>
            In depth — from {partyName}’s policy document
            {dive.source.documentDate && <span style={{ color: TERTIARY }}> · {dive.source.documentDate}</span>}
          </span>
        </div>

        <h2 style={{ fontSize: 'clamp(18px, 3.6vw, 22px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 9px', lineHeight: 1.25 }}>
          {dive.title}
        </h2>

        <p className="ddc-summary" style={{ fontSize: 14.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.65, margin: '0 0 16px', maxWidth: 700 }}>
          {dive.summary}
        </p>

        {facts.length > 0 && (
          <div className="ddc-facts" style={{ marginBottom: 16 }}>
            {facts.map((f) => (
              <div key={f.label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 11, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>{f.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px 16px' }}>
          <span className="ddc-cta" style={{ fontSize: 13.5, fontWeight: 800, color: accent, fontFamily: MANROPE }}>
            Read the full breakdown
            <ArrowRight className="ddc-cta-arrow" style={{ width: 15, height: 15 }} />
          </span>
          <span style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE }}>{meta.join(' · ')}</span>
        </div>
      </Link>
    </>
  )
}
