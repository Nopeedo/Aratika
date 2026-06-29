/**
 * /legislation — list of approved, enriched bills/acts (immersive-reader index).
 * Reads live from content_items (approved only). Empty until the first item is
 * approved in /editor.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, ArrowRight, Sparkles } from 'lucide-react'
import { SectionDivider } from '@/components/ui/section-divider'
import { getApprovedBills } from '@/lib/bills/live'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PolicyTopic } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Legislation, made readable',
  description: 'Plain-language, non-partisan breakdowns of New Zealand bills and acts — what they do and which policy areas they affect.',
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function LegislationIndexPage() {
  const bills = await getApprovedBills()

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '48px 36px 40px' }}>
          <div style={{ marginBottom: 10 }}><SectionDivider type="official" label="Legislation" /></div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Legislation, made readable</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
            Plain-language, non-partisan breakdowns of the bills and acts before Parliament — what each one does, and the
            policy areas it touches. Drafted from the official text and editor-reviewed.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 36px 64px' }}>
        {bills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', maxWidth: 520, margin: '0 auto' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles style={{ width: 28, height: 28, color: JADE }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 10px' }}>Breakdowns are on the way</h2>
            <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, margin: 0 }}>
              We pull bills daily from the official register and draft a plain-language breakdown of each. They appear here
              once an Aratika editor has reviewed them for accuracy and neutrality. Check back shortly.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {bills.map((b) => (
              <Link key={b.id} href={`/legislation/${b.slug}`} style={{ textDecoration: 'none' }}>
                <div className="party-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: JADE, background: '#ecfdf5', border: '1px solid #cfe9d8', borderRadius: 999, padding: '2px 9px', fontFamily: MANROPE, textTransform: 'capitalize' }}><FileText style={{ width: 11, height: 11 }} /> {b.docType}</span>
                  </div>
                  <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.3, marginBottom: 8 }}>{b.title}</div>
                  <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: '0 0 14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.summary}</p>
                  {b.policyLinks.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                      {b.policyLinks.slice(0, 4).map((p) => {
                        const meta = POLICY_TOPICS[p.topic as PolicyTopic]
                        return meta ? <span key={p.topic} style={{ fontSize: 11, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE }}>{meta.label}</span> : null
                      })}
                    </div>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE }}>Read the breakdown <ArrowRight style={{ width: 14, height: 14 }} /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
