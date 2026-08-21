/**
 * /hub — the returning-user election hub ("Command deck"). People who've been
 * here before (or are signed in) get this instead of the marketing landing:
 * a slim welcome + countdown, then their EXPANDED command centre (the things
 * they track + a feed of news on exactly those things), and below it a tiled
 * launcher for every other election feature. Personalises when signed in.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Target, MapPin, Vote, BarChart3, Scale, Swords, FileText, Wallet, Newspaper, GraduationCap, ArrowRight, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBattlegrounds } from '@/lib/battlegrounds'
import { BILLS_54 } from '@/constants/bills-54'
import { getPolls } from '@/lib/polls/live'
import { pollOfPolls } from '@/constants/polls-data'
import { PARTY_NAMES } from '@/constants/parties'
import { getNews, type NewsItem } from '@/lib/news/live'
import { CommandCentre, type TrackedItem } from '@/components/bookmarks/command-centre'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_PROFILES } from '@/constants/parties-data'
import type { Bookmark as BookmarkType } from '@/hooks/use-bookmarks'
import type { PartySlug } from '@/types'
import { BORDER, INK, JADE, JADE_DARK, MANROPE, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

const ELECTION_DATE = new Date('2026-11-07T00:00:00+13:00') // Sat 7 Nov 2026, NZ

export const metadata: Metadata = { title: 'Your election hub' }

const ESPRESSO = '#2A1206', WARM = '#5b3d2a', BODY = '#3f372f', SUB = '#6b6157'
const LINE = '#e9e4db'

interface Tile {
  href: string; title: string; desc: string; Icon: React.ComponentType<{ style?: React.CSSProperties }>
  tint: string; ink: string; stat?: string; dark?: boolean
}

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = (user?.user_metadata?.name as string) || (user?.email ? user.email.split('@')[0] : '')

  // ── The user's command centre: what they track + a feed on exactly those things ──
  let enriched: TrackedItem[] = []
  let feedNews: NewsItem[] = []
  let following = 0
  if (user) {
    const { data: bookmarksRaw } = await supabase
      .from('bookmarks')
      .select('id, kind, ref_id, label, sublabel, href, accent, created_at')
      .order('created_at', { ascending: false })
    const bookmarks = (bookmarksRaw ?? []) as BookmarkType[]

    // Enrich MP/party cards with display details, server-side (same as /dashboard).
    enriched = bookmarks.map((b) => {
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

    // Match news/video tags against everything they follow.
    const trackedParties = new Set<string>(), trackedTopics = new Set<string>()
    const trackedMps = new Set<string>(), trackedElectorates = new Set<string>()
    for (const b of bookmarks) {
      if (b.kind === 'party') trackedParties.add(b.ref_id)
      else if (b.kind === 'mp') { trackedMps.add(b.ref_id); const p = MP_PROFILES[b.ref_id]?.party; if (p) trackedParties.add(p) }
      else if (b.kind === 'policy') trackedTopics.add(b.ref_id)
      else if (b.kind === 'electorate') { trackedElectorates.add(b.ref_id); if (b.label) trackedElectorates.add(b.label) }
    }
    following = trackedParties.size + trackedTopics.size + trackedMps.size + trackedElectorates.size
    const matches = (parties: string[], topics: string[], mps: string[] = [], electorates: string[] = []) =>
      parties.some((p) => trackedParties.has(p)) || topics.some((t) => trackedTopics.has(t)) ||
      mps.some((m) => trackedMps.has(m)) || electorates.some((e) => trackedElectorates.has(e))
    if (following) {
      const allNews = await getNews()
      feedNews = allNews.filter((n) => matches(n.parties, n.topics, n.mps, n.electorates)).slice(0, 4)

      // Newest activity per tracked thing → the card's "new since last visit" badge.
      const latest: Record<string, number> = {}
      const bump = (k: string, t: number) => { if (t > (latest[k] ?? 0)) latest[k] = t }
      for (const n of allNews) {
        const t = n.pubDate ? Date.parse(n.pubDate) : NaN
        if (Number.isNaN(t)) continue
        for (const p of n.parties) bump(`party:${p}`, t)
        for (const tp of n.topics) bump(`policy:${tp}`, t)
        for (const m of n.mps) bump(`mp:${m}`, t)
        for (const e of n.electorates) bump(`electorate:${e}`, t)
      }
      enriched = enriched.map((b) => {
        const keys = b.kind === 'electorate' ? [`electorate:${b.ref_id}`, `electorate:${b.label}`] : [`${b.kind}:${b.ref_id}`]
        const la = Math.max(0, ...keys.map((k) => latest[k] ?? 0))
        return la ? { ...b, lastActivity: la } : b
      })
    }
  }
  const tracked = enriched.length

  // ── Live-ish stats for the tiles (cheap, local data + one poll query). ──
  const days = Math.max(0, Math.ceil((ELECTION_DATE.getTime() - Date.now()) / 86_400_000))
  const ultra = getBattlegrounds().filter((b) => b.tier.key === 'ultra').length
  const todayNZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
  const submissions = BILLS_54.filter((b) => b.submissionsCalled && b.submissionsClose && b.submissionsClose >= todayNZ).length
  const pop = pollOfPolls(await getPolls())
  const leader = [...pop].sort((a, b) => b.pct - a.pct)[0] ?? null
  const leaderLabel = leader ? `${PARTY_NAMES[leader.slug].short} ${leader.pct}%` : 'poll of polls'

  // `ink` = deep 700-level hue used for border + icon + title, matching the
  // homepage TopicChip strength (see topic-chip.tsx TOPIC_BORDER_HEX).
  const forYou: Tile[] = [
    { href: '/map', title: 'Your electorate', desc: 'Find your seat, your MP and the 2026 race.', Icon: MapPin, tint: '#fef1f2', ink: '#be123c' },
    { href: '/guide', title: 'Get ready to vote', desc: 'Enrol, and how your two votes work.', Icon: Vote, tint: '#ecfeff', ink: '#0e7490' },
  ]
  const election: Tile[] = [
    { href: '/elections/2026', title: 'Election Centre', desc: 'Polls, projection and live results on the night.', Icon: BarChart3, tint: '#eff4ff', ink: '#1d4ed8', stat: leaderLabel },
    { href: '/policies', title: 'Compare parties', desc: 'Every party, side by side on the issues.', Icon: Scale, tint: '#f5f3ff', ink: '#6d28d9' },
    { href: '/battlegrounds', title: 'Battlegrounds', desc: 'The marginal seats to watch.', Icon: Swords, tint: '#fff1f1', ink: '#b91c1c', stat: `${ultra} ultra-marginal` },
    { href: '/bills', title: 'The Record', desc: 'Bills and what this Parliament has done.', Icon: FileText, tint: '#fdf3ff', ink: '#a21caf', stat: submissions > 0 ? `${submissions} open for submissions` : undefined },
    { href: '/budget', title: 'Budget 2026', desc: 'Where the Government is spending.', Icon: Wallet, tint: '#fff6ed', ink: '#c2410c' },
    { href: '/news', title: 'Latest', desc: 'Election news and video.', Icon: Newspaper, tint: '#f0fdfa', ink: '#0f766e' },
    { href: '/learn', title: 'Learn the basics', desc: 'How voting and Parliament work.', Icon: GraduationCap, tint: '#fffbeb', ink: '#b45309' },
  ]

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: 'clamp(20px, 4vh, 34px) clamp(16px, 4vw, 36px) 64px' }}>

        {/* welcome + countdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE, fontFamily: MANROPE }}>Welcome back{name ? `, ${name}` : ''}</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(24px, 3.6vw, 34px)', fontWeight: 800, letterSpacing: '-.02em', color: ESPRESSO, fontFamily: MANROPE }}>Jump back in</h1>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eef7f0', border: '1px solid #cfeadb', borderRadius: 999, padding: '9px 16px', fontSize: 14, fontWeight: 800, color: JADE_DARK, fontFamily: MANROPE }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{days}</span> days to the vote
          </span>
        </div>

        {/* ═══ Expanded command centre — the centrepiece ═══ */}
        <section style={{ marginTop: 22, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 'clamp(18px, 3vw, 26px)', boxShadow: '0 1px 2px rgba(20,15,8,.04), 0 12px 30px -18px rgba(20,15,8,.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Target style={{ width: 21, height: 21, color: JADE }} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE }}>Your Command Centre</h2>
                <div style={{ fontSize: 13, color: SUB, fontFamily: MANROPE, marginTop: 1 }}>
                  {tracked > 0 ? `${tracked} thing${tracked === 1 ? '' : 's'} tracked. News on these follows you.` : 'Track the MPs, parties, issues and bills you care about.'}
                </div>
              </div>
            </div>
            <Link href={user ? '/dashboard' : '/command-centre'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: JADE_DARK, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {user ? 'Full dashboard' : 'How tracking works'} <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          <CommandCentre initial={enriched} />

          {/* From what you follow — a live feed on exactly the tracked things */}
          {feedNews.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 22, borderTop: `1px solid ${LINE}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Sparkles style={{ width: 17, height: 17, color: JADE }} />
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: INK, fontFamily: MANROPE }}>From what you follow</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 10 }}>
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
            </div>
          )}
        </section>

        {/* ═══ The tiles — every other feature, below the command centre ═══ */}
        <SectionLabel>For you</SectionLabel>
        <Grid tiles={forYou} />

        <SectionLabel>The election</SectionLabel>
        <Grid tiles={election} />

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link href="/?full=1" style={{ fontSize: 13, fontWeight: 700, color: SUB, fontFamily: MANROPE, textDecoration: 'none' }}>View the full homepage →</Link>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '26px 4px 2px' }}>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: WARM, fontFamily: MANROPE }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: LINE }} />
    </div>
  )
}

function Grid({ tiles }: { tiles: Tile[] }) {
  // Flex-fill so each row stretches to the full width — tiles spread evenly with
  // no empty gap on the right, and the last row fills too.
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
      {tiles.map((t) => (
        <Link key={t.href} href={t.href} className="party-card" style={{
          flex: '1 1 240px', minWidth: 0,
          display: 'block', textDecoration: 'none', borderRadius: 16, padding: '16px 16px 15px',
          background: t.tint, border: `2px solid ${t.ink}`, color: INK,
        }}>
          <t.Icon style={{ width: 24, height: 24, color: t.ink, marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE }}>{t.title}</div>
          <div style={{ fontSize: 13, color: BODY, lineHeight: 1.45, marginTop: 3, fontFamily: MANROPE }}>{t.desc}</div>
          {t.stat && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 11, fontSize: 12.5, fontWeight: 800, color: t.ink, fontFamily: MANROPE }}>
              {t.stat} <ArrowRight style={{ width: 13, height: 13 }} />
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
