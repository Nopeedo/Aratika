/**
 * PartyLegislativeRecord — "this term in law" for a party page. Neutral, factual,
 * with the governing-vs-opposition role made explicit. See
 * src/lib/parties/legislative-record.ts for the credibility notes.
 */

import Link from 'next/link'
import { Gavel, ExternalLink, BadgeCheck, Info, ArrowRight } from 'lucide-react'
import { legislativeRecordFor } from '@/lib/parties/legislative-record'
import { trackerBillCounts } from '@/lib/bills/member-party'
import { PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'
import { BORDER, DISPLAY, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

// Which parties actually have bills before the House in the tracker — so we only
// link through to /bills?party=… when there is something to show (opposition
// parties whose only activity is ballot members' bills have none yet).
const TRACKER_COUNTS = trackerBillCounts()

// Warm woven palette — matches the party page this card sits on.

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 110, background: accent ? '#f1f7f3' : SURFACE, border: `1px solid ${accent ? '#c9e6d4' : BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent ? '#166638' : INK, fontFamily: DISPLAY, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: SECONDARY, fontFamily: MANROPE, marginTop: 6, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

export function PartyLegislativeRecord({ party, partyName }: { party: PartySlug; partyName: string }) {
  const r = legislativeRecordFor(party)
  const nothing = r.govBillsLed === 0 && r.membersInBallot === 0 && r.membersPassed === 0
  if (nothing) return null
  const trackerCount = TRACKER_COUNTS[party] ?? 0
  const hasTrackerBills = trackerCount > 0
  // Party-colour outline, matching the cards either side of it on the page.
  const accent = PARTY_COLORS[party]?.bg ?? JADE
  const c = accent.replace('#', '')
  const rgb = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16)
  const outline = `rgba(${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}, 0.45)`

  return (
    <div style={{ background: '#fff', border: `2px solid ${outline}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 2px rgba(42,18,6,.04), 0 8px 20px -12px rgba(42,18,6,.14)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <Gavel style={{ width: 17, height: 17, color: accent }} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Legislative record this term</h2>
      </div>
      <p style={{ fontSize: 12.5, color: TERTIARY, fontFamily: MANROPE, margin: '0 0 14px' }}>54th Parliament · as at {r.asOf}</p>

      {r.governing ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <Stat value={r.govBillsPassed} label="Government bills passed into law" accent />
            <Stat value={r.govBillsLed} label="Government bills led (incl. in progress)" />
            <Stat value={r.membersPassed} label="Members’ bills passed" />
          </div>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
            As a governing party, {partyName}’s ministers lead government legislation. Government bills are the{' '}
            <b style={{ color: INK }}>coalition’s collective programme</b> — counted here by the party of the minister in charge,
            not as one party’s alone.{r.membersInBallot > 0 && <> {partyName} also has <b style={{ color: INK }}>{r.membersInBallot}</b> members’ bill{r.membersInBallot === 1 ? '' : 's'} in the ballot.</>}
          </p>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 11, marginBottom: 14 }}>
            <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.55 }}>
              As an opposition party, {partyName} doesn’t lead government bills (only ministers can). Its MPs advance policy through <b>members’ bills</b>: each MP may lodge one in a ballot, and a few are drawn at random each fortnight to be introduced. Most never are — so the ballot figure below is what’s <i>waiting</i>, not what’s before Parliament.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Stat value={r.membersPassed} label="Members’ bills passed into law" accent />
            <Stat value={r.membersInBallot} label="Lodged in the ballot — not yet introduced" />
            <Stat value={trackerCount} label="Before the House now" />
          </div>
          {r.passedMembersBills.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 8 }}>Passed into law</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {r.passedMembersBills.map((t) => (
                  <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <BadgeCheck style={{ width: 14, height: 14, color: '#166638', flexShrink: 0, position: 'relative', top: 2 }} />
                    <span style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.45 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: hasTrackerBills ? 'space-between' : 'flex-end', gap: 12, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
        {/* Says the count, because it sits under the ballot figure and "See all
            {party} bills" read as a link to those — the tracker only holds bills
            that have actually been introduced, which is far fewer. */}
        {hasTrackerBills && (
          <Link href={`/bills?party=${party}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
            See {partyName}’s {trackerCount} bill{trackerCount === 1 ? '' : 's'} before Parliament <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        )}
        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          Source: NZ Parliament — Bills <ExternalLink style={{ width: 12, height: 12 }} />
        </a>
      </div>
    </div>
  )
}
