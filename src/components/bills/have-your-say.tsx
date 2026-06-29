/**
 * HaveYourSay — submission / take-action CTA for a bill. When the bill is at the
 * select-committee stage, the public can make submissions, so we surface a
 * "draft a submission" CTA; otherwise a lighter "write to your MP" prompt.
 * Shared by the reader and the editor preview.
 */

import Link from 'next/link'
import { PenLine, ArrowRight } from 'lucide-react'

const INK = '#0c0e12', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function HaveYourSay({ stage, selectCommittee, slug, preview = false }: {
  stage: string | null
  selectCommittee?: string | null
  slug?: string
  preview?: boolean   // editor preview — render the CTA but don't navigate
}) {
  const open = stage === 'select-committee'
  const href = open ? `/take-action/submission${slug ? `?bill=${slug}` : ''}` : '/take-action'
  const cta = open ? 'Draft a submission' : 'Write to your MP'

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '22px 24px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <PenLine style={{ width: 17, height: 17, color: JADE }} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Have your say</h2>
      </div>
      <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, margin: '0 0 14px' }}>
        {open
          ? <>This bill is at the select committee stage — the time when the public can make submissions{selectCommittee ? ` to the ${selectCommittee} Committee` : ''}. Draft yours with Aratika, then lodge it through the official Parliament process before the closing date.</>
          : <>Submissions open once a bill reaches the select committee stage. In the meantime, you can write to your local MP about it.</>}
      </p>
      {preview ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: JADE, color: '#fff' }}>
          <PenLine style={{ width: 15, height: 15 }} /> {cta}
        </span>
      ) : (
        <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontFamily: MANROPE, padding: '10px 16px', borderRadius: 11, background: JADE, color: '#fff', textDecoration: 'none' }}>
          <PenLine style={{ width: 15, height: 15 }} /> {cta} <ArrowRight style={{ width: 15, height: 15 }} />
        </Link>
      )}
    </div>
  )
}
