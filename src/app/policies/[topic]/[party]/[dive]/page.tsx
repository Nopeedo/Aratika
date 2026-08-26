/**
 * /policies/[topic]/[party]/[dive] — one long-form policy breakdown, on its own
 * page.
 *
 * These used to stack inline on the party position page. One runs to about ten
 * phone screens and TOP's economy page carried three, so a reader arriving for
 * a party's position on the economy was handed thirty-three screens of it. The
 * position page now shows a card per breakdown and the depth lives here, chosen
 * rather than delivered.
 *
 * Being its own URL is worth something beyond length: a specific policy
 * breakdown is a linkable, indexable thing, which the inline version never was.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { CONTESTING_PARTIES } from '@/constants/parties'
import { PolicyTopic, PartySlug } from '@/types'
import { PolicyDeepDive } from '@/components/policy/policy-deep-dive'
import { getDeepDive } from '@/constants/policy-deep-dives'
import { PolicyCoverage } from '@/components/policy/policy-coverage'
import { SITE } from '@/constants/site'
import { BORDER, INK, JADE, MANROPE, SECONDARY, WOVEN_PAGE } from '@/constants/theme'

export const dynamic = 'force-dynamic'

type Params = Promise<{ topic: string; party: string; dive: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { topic, party, dive } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  const p = PARTY_PROFILES[party as PartySlug]
  const d = getDeepDive(topic, party, dive)
  if (!t || !p || !d) return { title: 'Breakdown not found' }
  return {
    title: `${d.title} · ${p.name}`,
    description: d.summary.slice(0, 200),
    alternates: { canonical: `${SITE.url}/policies/${topic}/${party}/${dive}` },
  }
}

export default async function DeepDivePage({ params }: { params: Params }) {
  const { topic, party, dive } = await params
  const t = POLICY_TOPICS[topic as PolicyTopic]
  const p = PARTY_PROFILES[party as PartySlug]
  if (!t || !p || party === 'independent' || !CONTESTING_PARTIES.includes(party as PartySlug)) notFound()

  const d = getDeepDive(topic, party, dive)
  if (!d) notFound()

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ height: 6, background: p.color }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 28px' }}>
          {/* Back to the party's position on this topic — the page this came
              from — not to the topic index. */}
          <Link
            href={`/policies/${topic}/${party}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 16 }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> {p.name} on {t.label}
          </Link>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE, marginBottom: 6 }}>
            {t.label} · In depth
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.15 }}>
            {d.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px clamp(18px, 5vw, 36px) 64px' }}>
        {/* The page header above already carries the title as the <h1>. */}
        <PolicyDeepDive dive={d} accent={p.color} partyName={p.name} showTitle={false} />

        <div style={{ marginTop: 26, textAlign: 'center' }}>
          <Link
            href={`/policies/${topic}/${party}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: JADE, textDecoration: 'none', fontFamily: MANROPE }}
          >
            <ArrowLeft style={{ width: 15, height: 15 }} /> Back to {p.name} on {t.label}
          </Link>
        </div>
      </div>
      <PolicyCoverage maxWidth={900} />
    </div>
  )
}
