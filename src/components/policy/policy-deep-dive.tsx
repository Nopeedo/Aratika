/**
 * PolicyDeepDive — the long-form breakdown of one party's policy document.
 *
 * Sits below the position reader on /policies/[topic]/[party]. The reader
 * answers "what is their position"; this answers "how would it work, and what
 * happens in my situation". Server component; renders nothing when the pair has
 * no document.
 *
 * Framing matters as much as content here. Every section says whose document
 * this is, the worked examples are labelled as the party's own, and the open
 * questions sit in the same visual weight as the mechanics — so a reader can
 * see what the policy settles and what it defers without us telling them what
 * to think about either.
 */

import { Quote, ScrollText, ListChecks, XCircle, CheckCircle2, HelpCircle, Coins, BookOpen, ExternalLink } from 'lucide-react'
import type { PolicyDeepDive as DeepDive } from '@/constants/policy-deep-dives'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

const DEEP_DIVE_CSS = `
.dd-facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(190px, 100%), 1fr)); gap: 10px; }
.dd-split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.dd-example { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.dd-revenue { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr)); gap: 8px; }
@media (max-width: 760px) {
  .dd-split, .dd-example { grid-template-columns: 1fr; gap: 12px; }
}
`

export function PolicyDeepDive({
  dive,
  accent,
  partyName,
  showTitle = true,
}: {
  dive: DeepDive
  accent: string
  partyName: string
  /** Off when the page around it already carries the title as its <h1>, which
   *  is every case now that dives have their own pages. The attribution line
   *  stays either way — "this is their document, not ours" is the one piece of
   *  framing that should never be dropped for tidiness. */
  showTitle?: boolean
}) {
  const covered = dive.covered ?? []
  const exempt = dive.exempt ?? []
  const both = covered.length > 0 && exempt.length > 0
  return (
    <section style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 'clamp(18px, 4vw, 28px)' }}>
      <style dangerouslySetInnerHTML={{ __html: DEEP_DIVE_CSS }} />

      {/* Header — names the document up front, so nothing below reads as ours */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: showTitle ? 6 : 14 }}>
        <ScrollText style={{ width: 16, height: 16, color: accent }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: SECONDARY, fontFamily: MANROPE }}>
          In depth — from {partyName}’s policy document
          {dive.source.documentDate && <span style={{ color: TERTIARY }}> · {dive.source.documentDate}</span>}
        </span>
      </div>
      {showTitle && (
        <h2 style={{ fontSize: 'clamp(20px, 4.4vw, 26px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 10px', lineHeight: 1.2 }}>
          {dive.title}
        </h2>
      )}
      <p style={{ fontSize: 15, color: '#23262c', fontFamily: MANROPE, lineHeight: 1.7, margin: '0 0 22px', maxWidth: 720 }}>
        {dive.summary}
      </p>

      {/* At a glance */}
      <div className="dd-facts" style={{ marginBottom: 26 }}>
        {dive.facts.map((f) => (
          <div key={f.label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 5 }}>{f.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.25 }}>{f.value}</div>
            {f.note && <div style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45, marginTop: 4 }}>{f.note}</div>}
          </div>
        ))}
      </div>

      {/* What's in, what's out — the question most readers actually arrive with.
          Side by side when both exist; on its own, full width, when only one
          does; skipped entirely when neither does. */}
      {(covered.length > 0 || exempt.length > 0) && (
        <div className={both ? 'dd-split' : undefined} style={{ marginBottom: 26 }}>
          {covered.length > 0 && (
            <ListPanel icon={CheckCircle2} tone={accent} title={dive.coveredLabel ?? 'What it applies to'} items={covered} />
          )}
          {exempt.length > 0 && (
            <ListPanel icon={XCircle} tone={TERTIARY} title={dive.exemptLabel ?? 'What is exempt'} items={exempt} />
          )}
        </div>
      )}

      {/* Mechanics */}
      <Heading icon={ListChecks} accent={accent}>How it would work</Heading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 26 }}>
        {dive.mechanics.map((m) => (
          <div key={m.heading} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '15px 17px' }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 6 }}>{m.heading}</div>
            <p style={{ fontSize: 14, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.65, margin: 0 }}>{m.body}</p>
            {m.bullets && (
              <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {m.bullets.map((bl) => (
                  <li key={bl} style={{ display: 'flex', gap: 9, fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 8 }} />{bl}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Worked examples */}
      {dive.examples.length > 0 && (
        <>
          <Heading icon={BookOpen} accent={accent}>Worked examples</Heading>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.55 }}>
            {dive.examples.every((e) => e.fromDocument)
              ? `These scenarios and figures are ${partyName}’s own, from the document.`
              : `Scenarios marked as from the document are ${partyName}’s own.`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 26 }}>
            {dive.examples.map((ex) => (
              <div key={ex.title} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 12 }}>{ex.title}</div>
                <div className="dd-example">
                  <StepList label="The situation" items={ex.setup} dot={TERTIARY} />
                  <StepList label="What happens" items={ex.outcome} dot={accent} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Revenue */}
      {dive.revenue && (
        <>
          <Heading icon={Coins} accent={accent}>{dive.revenue.heading ?? 'What they expect it to raise'}</Heading>
          <div className="dd-revenue" style={{ marginBottom: 10 }}>
            {dive.revenue.rows.map((r) => (
              <div key={r.period} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '11px 13px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 4 }}>{r.period}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, fontVariantNumeric: 'tabular-nums' }}>{r.amount}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 26px', lineHeight: 1.55 }}>{dive.revenue.basis}</p>
        </>
      )}

      {/* Verbatim quotes */}
      {dive.quotes.length > 0 && (
        <>
          <Heading icon={Quote} accent={accent}>In their own words</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
            {dive.quotes.map((q) => (
              <blockquote key={q.text} style={{ margin: 0, background: '#fff', border: `1px solid ${BORDER}`, borderLeft: `3px solid ${accent}`, borderRadius: '0 12px 12px 0', padding: '13px 16px' }}>
                <p style={{ fontSize: 14, color: '#23262c', fontFamily: MANROPE, lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>“{q.text}”</p>
                <footer style={{ fontSize: 11.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 7 }}>{dive.source.documentTitle} · {q.context}</footer>
              </blockquote>
            ))}
          </div>
        </>
      )}

      {/* What the document leaves open */}
      {dive.openQuestions.length > 0 && (
        <>
          <Heading icon={HelpCircle} accent={accent}>What the document doesn’t settle</Heading>
          <p style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.55 }}>
            Points the document defers or leaves undefined. These are gaps in the document, not criticisms of the policy.
          </p>
          <ul style={{ margin: '0 0 26px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {dive.openQuestions.map((q) => (
              <li key={q} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.6, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '11px 14px' }}>
                <HelpCircle style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />{q}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Source */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <ScrollText style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6 }}>
            Summarised from <b style={{ color: INK }}>{dive.source.documentTitle}</b>, published by {dive.source.publisher}
            {dive.source.documentDate ? <> in {dive.source.documentDate}</> : null}.
            {dive.source.authorisedBy && <> Authorised by {dive.source.authorisedBy}.</>}
            {' '}Read {dive.source.retrieved}.
          </div>
          {/* Every document the page draws on gets named, not just the primary
              one — a reader checking a figure needs to know where to look. */}
          {dive.source.alsoFrom?.map((a) => (
            <div key={a.documentTitle} style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, marginTop: 3 }}>
              Also drawn from <b style={{ color: INK }}>{a.documentTitle}</b>
              {a.note ? <>, {a.note}</> : null}.
            </div>
          ))}
          {dive.source.url ? (
            <a href={dive.source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none', marginTop: 5 }}>
              Read the full document <ExternalLink style={{ width: 12, height: 12 }} />
            </a>
          ) : (
            // No invented links. Until the public URL is confirmed the page says
            // so plainly rather than pointing somewhere that may not hold it.
            <div style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, marginTop: 5, fontStyle: 'italic' }}>
              Link to the published document to come.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Heading({ icon: Icon, accent, children }: { icon: React.ElementType; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
      <Icon style={{ width: 15, height: 15, color: accent }} />
      <h3 style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>{children}</h3>
    </div>
  )
}

function ListPanel({ icon: Icon, tone, title, items }: { icon: React.ElementType; tone: string; title: string; items: string[] }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '15px 17px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Icon style={{ width: 15, height: 15, color: tone }} />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{title}</span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((it) => (
          <li key={it} style={{ display: 'flex', gap: 9, fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: tone, flexShrink: 0, marginTop: 8 }} />{it}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StepList({ label, items, dot }: { label: string; items: string[]; dot: string }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 8 }}>{label}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map((it) => (
          <li key={it} style={{ display: 'flex', gap: 9, fontSize: 13.5, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.55 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 8 }} />{it}
          </li>
        ))}
      </ul>
    </div>
  )
}
