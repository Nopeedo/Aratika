/**
 * /record/analysis — PRIVATE flagship policy deep dives.
 * Login-gated + noindex. Drafted, clearly-flagged summaries of the documented
 * debate, with who's-affected pointing to official analysis (RIS), and public
 * reception only where citable. No causal economic claims. Data: record-analysis.ts.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldAlert, Plus, Minus, Users, Target, ExternalLink, FileText, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { POLICY_ANALYSIS } from '@/constants/record-analysis'

export const metadata: Metadata = {
  title: 'Policy deep dives (private)',
  robots: { index: false, follow: false },
}

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function PolicyAnalysisPage() {
  const supabase = await createClient()
  let user = null
  try { const { data } = await supabase.auth.getUser(); user = data.user } catch { /* stale cookie */ }
  if (!user) redirect('/login?next=/record/analysis')

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#0c0e12', color: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '38px 36px 30px' }}>
          <Link href="/record" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.6)', fontFamily: MANROPE, textDecoration: 'none', marginBottom: 14 }}>
            ← All accountability data
          </Link>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#36e08a', fontFamily: MANROPE, marginBottom: 10 }}>
            Policy deep dives · Private
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-.02em', fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.1 }}>
            The flagship policies, weighed up
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', fontFamily: MANROPE, lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
            What each was designed to do, the arguments made for and against it, who it affects, and where to read the official analysis.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 36px 72px' }}>
        {/* Caveat */}
        <div style={{ display: 'flex', gap: 12, padding: '15px 17px', background: '#fff9e6', border: '1px solid #fde68a', borderRadius: 14, marginBottom: 30 }}>
          <ShieldAlert style={{ width: 18, height: 18, color: '#b45309', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: '#92400e', fontFamily: MANROPE, margin: 0, lineHeight: 1.6 }}>
            <b>Drafted summaries — verify.</b> The arguments below describe the <b>documented public debate</b> (attributed to
            who made them) — they are contested claims, not Aratika’s verdict, assessed to a January 2026 cutoff. Who’s
            affected points to the official Regulatory Impact Statement; figures live there. Nothing here attributes an
            economic outcome to a single policy.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {POLICY_ANALYSIS.map((p) => (
            <div key={p.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 8px', lineHeight: 1.15 }}>{p.title}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Target style={{ width: 15, height: 15, color: JADE, flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
                    <b style={{ color: INK }}>Designed to affect:</b> {p.designedToAffect}
                  </p>
                </div>
              </div>

              <div style={{ padding: '16px 20px' }}>
                {/* For / Against */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  <ArgColumn kind="for" items={p.argumentsFor} />
                  <ArgColumn kind="against" items={p.argumentsAgainst} />
                </div>

                {/* Most affected */}
                <div style={{ display: 'flex', gap: 9, marginTop: 16, padding: '12px 14px', background: SURFACE, borderRadius: 12 }}>
                  <Users style={{ width: 16, height: 16, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
                    <b style={{ color: INK }}>Who’s most affected:</b> {p.mostAffected}
                  </p>
                </div>

                {/* Public reception (only if citable) */}
                {p.publicReception && (
                  <div style={{ display: 'flex', gap: 9, marginTop: 10, padding: '12px 14px', border: `1px dashed ${BORDER}`, borderRadius: 12 }}>
                    <MessageSquare style={{ width: 16, height: 16, color: SECONDARY, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
                      <b style={{ color: INK }}>Public reception:</b> {p.publicReception}
                    </p>
                  </div>
                )}

                {/* Official analysis */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 800, color: TERTIARY, textTransform: 'uppercase', letterSpacing: '.04em', fontFamily: MANROPE }}>
                    <FileText style={{ width: 13, height: 13 }} /> Official analysis
                  </span>
                  {p.official.map((o) => (
                    <a key={o.url + o.label} href={o.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
                      {o.label} <ExternalLink style={{ width: 12, height: 12 }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 22, lineHeight: 1.5 }}>
          Official links open the source’s main area (legislation.govt.nz, Parliament, Treasury) — locate the specific Act,
          Regulatory Impact Statement or select-committee report there. Full promise scorecard and bills on the{' '}
          <Link href="/record/national" style={{ color: JADE, fontWeight: 700 }}>National record</Link>.
        </p>
      </div>
    </div>
  )
}

function ArgColumn({ kind, items }: { kind: 'for' | 'against'; items: string[] }) {
  const isFor = kind === 'for'
  const Icon = isFor ? Plus : Minus
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={{ width: 20, height: 20, borderRadius: 6, background: SURFACE, border: `1px solid ${BORDER}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color: SECONDARY }} />
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{isFor ? 'Arguments for' : 'Arguments against'}</span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((t, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.5 }}>
            <span style={{ color: TERTIARY, flexShrink: 0 }}>•</span> {t}
          </li>
        ))}
      </ul>
    </div>
  )
}
