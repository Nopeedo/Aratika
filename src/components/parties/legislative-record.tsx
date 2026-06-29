/**
 * PartyLegislativeRecord — "this term in law" for a party page. Neutral, factual,
 * with the governing-vs-opposition role made explicit. See
 * src/lib/parties/legislative-record.ts for the credibility notes.
 */

import Link from 'next/link'
import { Gavel, ExternalLink, BadgeCheck, Info, ArrowRight } from 'lucide-react'
import { legislativeRecordFor } from '@/lib/parties/legislative-record'
import { partiesWithTrackerBills } from '@/lib/bills/member-party'
import type { PartySlug } from '@/types'

// Which parties actually have bills before the House in the tracker — so we only
// link through to /bills?party=… when there is something to show (opposition
// parties whose only activity is ballot members' bills have none yet).
const PARTIES_WITH_BILLS = partiesWithTrackerBills()

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

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
  const hasTrackerBills = PARTIES_WITH_BILLS.has(party)

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 4px rgba(12,14,18,.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <Gavel style={{ width: 17, height: 17, color: JADE }} />
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
              As an opposition party, {partyName} doesn’t lead government bills (only ministers can). Its MPs advance policy through <b>members’ bills</b> — drawn from a ballot, so getting one passed is uncommon.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Stat value={r.membersPassed} label="Members’ bills passed into law" accent />
            <Stat value={r.membersInBallot} label="Members’ bills in the ballot" />
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
        {hasTrackerBills && (
          <Link href={`/bills?party=${party}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
            See all {partyName} bills <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        )}
        <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, textDecoration: 'none' }}>
          Source: NZ Parliament — Bills <ExternalLink style={{ width: 12, height: 12 }} />
        </a>
      </div>
    </div>
  )
}
