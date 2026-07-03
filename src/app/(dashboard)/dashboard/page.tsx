/**
 * /dashboard — signed-in landing. Server-gated: redirects to /login without a session.
 * Bookmarks + live MP/bill tracking land here once the bookmarks table + RLS are added.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Crown, Map, ArrowRight, PenLine, Sparkles, CheckCircle2, Highlighter, Bookmark, Newspaper } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ManageBillingButton } from '@/components/billing/billing-buttons'
import { CommandCentre, type TrackedItem } from '@/components/bookmarks/command-centre'
import { DashboardElection } from '@/components/dashboard/election-module'
import { BASELINE_ELECTION } from '@/constants/elections-data'
import { VideoSection } from '@/components/news/video-section'
import type { Bookmark as BookmarkType } from '@/hooks/use-bookmarks'
import { isEnabled, PREMIUM_ENABLED } from '@/constants/features'
import { getNews } from '@/lib/news/live'
import { getVideos } from '@/lib/news/videos'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import type { PartySlug, PolicyTopic } from '@/types'

export const metadata: Metadata = { title: 'My Dashboard' }

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function DashboardPage() {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Malformed/stale auth cookie — treat as logged out rather than erroring.
  }
  if (!user) redirect('/login')

  const name = (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'there'

  const { data: sub } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
  // Paid tier off → treat everyone as premium so all features are free.
  const isPremium = !PREMIUM_ENABLED || ['active', 'trialing'].includes((sub?.status as string) ?? '')

  // The user's saved bill highlights/notes, grouped by bill.
  const { data: annsRaw } = await supabase
    .from('bill_annotations')
    .select('id, bill_slug, bill_title, quote, note, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  type Ann = { id: string; bill_slug: string | null; bill_title: string | null; quote: string; note: string | null }
  const annGroups = Object.values(((annsRaw ?? []) as Ann[]).reduce<Record<string, { slug: string | null; title: string; items: Ann[] }>>((acc, a) => {
    const key = a.bill_slug || a.id
    ;(acc[key] ||= { slug: a.bill_slug, title: a.bill_title || 'Legislation', items: [] }).items.push(a)
    return acc
  }, {}))

  // The user's command centre — everything they've chosen to track.
  const { data: bookmarksRaw } = await supabase
    .from('bookmarks')
    .select('id, kind, ref_id, label, sublabel, href, accent, created_at')
    .order('created_at', { ascending: false })
  const bookmarks = (bookmarksRaw ?? []) as BookmarkType[]

  // Enrich tracked MP/party cards with display details (photo, party, leader) — server-side
  // so we don't ship the full MP/party dataset to the client.
  const enriched: TrackedItem[] = bookmarks.map((b) => {
    if (b.kind === 'mp') {
      const mp = MP_PROFILES[b.ref_id]
      const role = mp ? (mp.role === 'electorate' ? `MP for ${mp.electorate}` : `${PARTY_PROFILES[mp.party]?.name ?? ''} list MP`) : b.sublabel
      return { ...b, photo: mp?.photo, party: mp?.party, role }
    }
    if (b.kind === 'party') {
      const p = PARTY_PROFILES[b.ref_id as PartySlug]
      return { ...b, accent: p?.color ?? b.accent, role: p ? `Led by ${p.leader}` : b.sublabel }
    }
    return b
  })

  // What is the user following? Parties (directly or via a tracked MP) AND policy topics.
  const trackedParties = new Set<string>()
  const trackedTopics = new Set<string>()
  for (const b of bookmarks) {
    if (b.kind === 'party') trackedParties.add(b.ref_id)
    else if (b.kind === 'mp') { const p = MP_PROFILES[b.ref_id]?.party; if (p) trackedParties.add(p) }
    else if (b.kind === 'policy') trackedTopics.add(b.ref_id)
  }
  const following = trackedParties.size + trackedTopics.size
  const matches = (parties: string[], topics: string[]) =>
    parties.some((p) => trackedParties.has(p)) || topics.some((t) => trackedTopics.has(t))

  // Election module — the parties they follow with their 2023 baseline seats, and their tracked electorates.
  const seatByParty = Object.fromEntries((BASELINE_ELECTION.results ?? []).map((r) => [r.party, r.seats]))
  const electionParties = [...trackedParties].map((slug) => ({
    slug, short: PARTY_NAMES[slug as PartySlug]?.short ?? slug,
    color: PARTY_COLORS[slug as PartySlug]?.bg ?? JADE, seats2023: seatByParty[slug] ?? 0,
  }))
  const electionElectorates = bookmarks
    .filter((b) => b.kind === 'electorate')
    .map((b) => ({ label: b.label, href: b.href || `/map?search=${encodeURIComponent(b.ref_id)}` }))
  // Personalised feed — news + videos tagged to anything they follow (party or issue).
  const [allNews, allVideos] = following ? await Promise.all([getNews(), getVideos()]) : [[], []]
  const feedNews = allNews.filter((n) => matches(n.parties, n.topics)).slice(0, 6)
  const feedVideos = allVideos.filter((v) => matches(v.parties, v.topics)).slice(0, 10)

  // Bill highlights are a Phase-2 feature; only surface them once legislation ships.
  const showHighlights = isEnabled('legislation')

  return (
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 64px)' }}>
      <div className="bg-dot-grid" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 36px 32px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>
            Kia ora, {name}
          </h1>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Welcome to your Aratika dashboard. Signed in as {user.email}.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 36px 64px' }}>

        {/* Premium status / upsell — only when the premium tier has shipped */}
        {isEnabled('premium') && (isPremium ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            background: 'linear-gradient(145deg,#ecfdf5,#f7fffb)', border: '1px solid #a7f3d0',
            borderRadius: 16, padding: '20px 22px', marginBottom: 28,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles style={{ width: 22, height: 22, color: JADE }} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 800, color: '#065f46', fontFamily: MANROPE }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} /> You’re a Premium member
              </div>
              <div style={{ fontSize: 13, color: '#047857', fontFamily: MANROPE, marginTop: 2 }}>
                Thanks for supporting an independent, non-partisan platform. The Take Action studio is unlocked.
              </div>
            </div>
            <ManageBillingButton />
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            background: 'linear-gradient(145deg,#fff9e6,#fffdf5)', border: '1px solid #fde68a',
            borderRadius: 16, padding: '20px 22px', marginBottom: 28,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Crown style={{ width: 22, height: 22, color: '#b45309' }} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e', fontFamily: MANROPE }}>Unlock the Take Action studio with Premium</div>
              <div style={{ fontSize: 13, color: '#a16207', fontFamily: MANROPE, marginTop: 2 }}>
                Draft letters and submissions, and (soon) bookmark and track MPs, bills and policies.
              </div>
            </div>
            <Link href="/subscription" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#F5C518', color: '#1c1605', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              <Crown style={{ width: 15, height: 15 }} /> See Premium
            </Link>
          </div>
        ))}

        {/* Election 2026 — the live, time-bound hook, tied to what they follow */}
        <div style={{ marginBottom: 32 }}>
          <DashboardElection parties={electionParties} electorates={electionElectorates} />
        </div>

        {/* Command centre — the centrepiece */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Bookmark style={{ width: 18, height: 18, color: JADE }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Your command centre</h2>
          </div>
          <CommandCentre initial={enriched} />
        </div>

        {/* From what you follow — personalised news + video (parties + issues) */}
        {following > 0 && (feedNews.length > 0 || feedVideos.length > 0) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <Sparkles style={{ width: 18, height: 18, color: JADE }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>From what you follow</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[...trackedParties].map((p) => (
                <span key={`p-${p}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PARTY_COLORS[p as PartySlug]?.bg ?? JADE }} />
                  {PARTY_NAMES[p as PartySlug]?.short ?? p}
                </span>
              ))}
              {[...trackedTopics].map((t) => (
                <span key={`t-${t}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: SECONDARY, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: JADE }} />
                  {POLICY_TOPICS[t as PolicyTopic]?.label ?? t}
                </span>
              ))}
            </div>

            {feedNews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10, marginBottom: feedVideos.length ? 24 : 0 }}>
                {feedNews.map((n) => (
                  <a key={n.id} href={n.link} target="_blank" rel="noopener noreferrer" className="party-card" style={{ display: 'flex', gap: 11, textDecoration: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '11px 12px', background: '#fff' }}>
                    <span style={{ width: 64, height: 48, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {n.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={n.image} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Newspaper style={{ width: 18, height: 18, color: '#5b7cc4' }} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, marginBottom: 2 }}>{n.outlet}</span>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 13, fontWeight: 700, color: INK, fontFamily: MANROPE, lineHeight: 1.35 }}>{n.title}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}

            {feedVideos.length > 0 && <VideoSection videos={feedVideos} />}
          </div>
        )}

        {/* Your highlights & notes (Phase 2) */}
        {showHighlights && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Highlighter style={{ width: 18, height: 18, color: JADE }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>Your highlights &amp; notes</h2>
          </div>
          {annGroups.length === 0 ? (
            <div style={{ border: `1px dashed ${TERTIARY}`, borderRadius: 14, padding: '18px 20px', background: SURFACE, fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6 }}>
              When you highlight passages while reading a bill, they collect here with your notes.{isPremium ? '' : ' Highlighting is a Premium feature.'}{' '}
              <Link href="/bills" style={{ color: JADE, fontWeight: 700 }}>Browse bills →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {annGroups.map((g) => (
                <div key={g.slug ?? g.title} style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 18px' }}>
                  {g.slug
                    ? <Link href={`/legislation/${g.slug}`} style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{g.title} <ArrowRight style={{ width: 14, height: 14, color: JADE }} /></Link>
                    : <span style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{g.title}</span>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    {g.items.map((a) => (
                      <div key={a.id} style={{ borderLeft: '3px solid #ffe08a', paddingLeft: 12 }}>
                        <p style={{ fontSize: 13, color: '#33373f', fontFamily: MANROPE, lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>“{a.quote.length > 220 ? a.quote.slice(0, 220) + '…' : a.quote}”</p>
                        {a.note && <p style={{ fontSize: 13, color: INK, fontFamily: MANROPE, lineHeight: 1.5, margin: '4px 0 0' }}>{a.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Explore — keep the user moving toward what matters this phase */}
        <div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: JADE, color: '#fff', fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
            <Map style={{ width: 15, height: 15 }} /> Find your electorate
          </Link>
          <Link href="/mps" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
            Browse MPs <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
          <Link href="/compare" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
            Compare parties <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
          {isEnabled('take-action') && (
            <Link href="/take-action" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
              <PenLine style={{ width: 15, height: 15 }} /> Take action
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
