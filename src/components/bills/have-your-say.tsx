/**
 * HaveYourSay — submission / take-action CTA for a bill.
 *
 * Two things this must get right, because both were wrong before:
 *
 *  1. "Open for submissions" is NOT the same as "at select committee". A bill can
 *     sit at that stage after the window has closed, so we only invite a
 *     submission when the committee actually called for them AND the closing date
 *     has not passed. Getting this wrong sends people to a door that has shut.
 *
 *  2. The lodge-it link must go to Parliament. The internal /take-action/submission
 *     route is a Phase 2 feature and is currently gated — linking there sent
 *     readers to /coming-soon from a card telling them they could have their say.
 *     Parliament's own bill page is where a submission is actually made, so that
 *     is the primary action whenever we have the URL.
 *
 * `today` is resolved after mount, never during render: the server and the browser
 * can straddle midnight, and a date computed in render is a hydration mismatch.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PenLine, ArrowRight, ExternalLink } from 'lucide-react'
import { isEnabled } from '@/constants/features'

const INK = '#0c0e12', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

/** "13 August 2026" — a deadline should read like a date, not an ISO string. */
function fmtDate(iso?: string | null) {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function HaveYourSay({ stage, selectCommittee, slug, officialUrl, submissionsCalled, submissionsClose, preview = false }: {
  stage: string | null
  selectCommittee?: string | null
  slug?: string
  officialUrl?: string | null
  submissionsCalled?: boolean
  submissionsClose?: string | null
  preview?: boolean   // editor preview — render the CTA but don't navigate
}) {
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => { setToday(new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })) }, [])

  // Only genuinely open when submissions were called and the date hasn't passed.
  // Until `today` resolves we fall back to the stage, so the card still renders
  // server-side without asserting a deadline we can't yet check.
  const closed = Boolean(submissionsClose && today && submissionsClose < today)
  const open = submissionsCalled === undefined
    ? stage === 'select-committee'
    : Boolean(submissionsCalled) && !closed

  const closeDate = fmtDate(submissionsClose)
  const draftingEnabled = isEnabled('take-action')

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <PenLine style={{ width: 17, height: 17, color: JADE }} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Have your say</h2>
      </div>

      <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 14px' }}>
        {open ? (
          <>
            This bill is open for public submissions{selectCommittee ? ` to the ${selectCommittee} Committee` : ''} — anyone can tell the committee what they think, and you don’t need to be an expert.
            {closeDate ? <> Submissions close <b style={{ color: INK }}>{closeDate}</b>.</> : null}
          </>
        ) : closed ? (
          <>Submissions on this bill have closed{closeDate ? ` (they closed ${closeDate})` : ''}. You can still write to your local MP about it.</>
        ) : (
          <>Submissions open once a bill reaches the select committee stage and the committee calls for them. In the meantime, you can write to your local MP about it.</>
        )}
      </p>

      {preview ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: JADE, color: '#fff' }}>
          <PenLine style={{ width: 15, height: 15 }} /> {open ? 'Make a submission' : 'Write to your MP'}
        </span>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {/* Primary action: Parliament's own page, where a submission is actually lodged. */}
          {open && officialUrl && (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer"
               style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: JADE, color: '#fff', textDecoration: 'none' }}>
              <PenLine style={{ width: 15, height: 15 }} /> Make a submission at Parliament <ExternalLink style={{ width: 14, height: 14 }} />
            </a>
          )}
          {/* Our own drafting helper — only when that feature is actually live. */}
          {open && draftingEnabled && (
            <Link href={`/take-action/submission${slug ? `?bill=${slug}` : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: '#fff', color: INK, border: `1px solid ${BORDER}`, textDecoration: 'none' }}>
              Draft one with Arapono <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          )}
          {/* Fallback when there is nothing to submit to (or no URL to send them to). */}
          {(!open || !officialUrl) && (
            <Link href="/mps"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: open ? JADE : '#fff', color: open ? '#fff' : INK, border: open ? 'none' : `1px solid ${BORDER}`, textDecoration: 'none' }}>
              Write to your MP <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
