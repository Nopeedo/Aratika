/**
 * /hub — the returning-user election hub ("Command deck"). Instead of the
 * marketing landing page, people who've been here before (or are signed in) get
 * a tiled launcher: a slim welcome + countdown, then every election feature and
 * their own dashboard, grouped "For you" vs "The election". Personalises when
 * signed in (name, how many things they track); generic otherwise.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Compass, MapPin, Vote, BarChart3, Scale, Swords, FileText, Wallet, Newspaper, GraduationCap, ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBattlegrounds } from '@/lib/battlegrounds'
import { BILLS_54 } from '@/constants/bills-54'
import { getPolls } from '@/lib/polls/live'
import { pollOfPolls } from '@/constants/polls-data'
import { PARTY_NAMES } from '@/constants/parties'

const ELECTION_DATE = new Date('2026-11-07T00:00:00+13:00') // Sat 7 Nov 2026, NZ

export const metadata: Metadata = { title: 'Your election hub' }

const INK = '#0c0e12', ESPRESSO = '#2A1206', WARM = '#5b3d2a', BODY = '#3f372f', SUB = '#6b6157', FAINT = '#9a9186'
const LINE = '#e9e4db', JADE = '#1F8A4C', JADE_DARK = '#176B3B'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

interface Tile {
  href: string; title: string; desc: string; Icon: React.ComponentType<{ style?: React.CSSProperties }>
  tint: string; ink: string; stat?: string; dark?: boolean
}

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = (user?.user_metadata?.name as string) || (user?.email ? user.email.split('@')[0] : '')

  let tracked = 0
  if (user) {
    const { count } = await supabase.from('bookmarks').select('id', { count: 'exact', head: true })
    tracked = count ?? 0
  }

  // Live-ish stats (cheap, local data + one poll query).
  const days = Math.max(0, Math.ceil((ELECTION_DATE.getTime() - Date.now()) / 86_400_000))
  const ultra = getBattlegrounds().filter((b) => b.tier.key === 'ultra').length
  const todayNZ = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' })
  const submissions = BILLS_54.filter((b) => b.submissionsCalled && b.submissionsClose && b.submissionsClose >= todayNZ).length
  const pop = pollOfPolls(await getPolls())
  const leader = [...pop].sort((a, b) => b.pct - a.pct)[0] ?? null
  const leaderLabel = leader ? `${PARTY_NAMES[leader.slug].short} ${leader.pct}%` : 'poll of polls'

  const forYou: Tile[] = [
    { href: '/command-centre', title: 'Your Command Centre', desc: 'The MPs, parties and bills you follow — news gathered for you.', Icon: Compass, tint: '#ecfdf3', ink: '#1F8A4C', stat: tracked > 0 ? `${tracked} tracked` : 'Start tracking' },
    { href: '/map', title: 'Your electorate', desc: 'Find your seat, your MP and the 2026 race.', Icon: MapPin, tint: '#fef1f2', ink: '#e11d48' },
    { href: '/guide', title: 'Get ready to vote', desc: 'Enrol, and how your two votes work.', Icon: Vote, tint: '#ecfeff', ink: '#0891b2' },
  ]
  const election: Tile[] = [
    { href: '/elections/2026', title: 'Election Centre', desc: 'Polls, projection and live results on the night.', Icon: BarChart3, tint: '#eff4ff', ink: '#1d4ed8', stat: leaderLabel },
    { href: '/compare', title: 'Compare parties', desc: 'Every party, side by side on the issues.', Icon: Scale, tint: '#f5f3ff', ink: '#7c3aed' },
    { href: '/battlegrounds', title: 'Battlegrounds', desc: 'The marginal seats to watch.', Icon: Swords, tint: '#fff1f1', ink: '#dc2626', stat: `${ultra} ultra-marginal` },
    { href: '/bills', title: 'The Record', desc: 'Bills and what this Parliament has done.', Icon: FileText, tint: '#fdf3ff', ink: '#a21caf', stat: submissions > 0 ? `${submissions} open for submissions` : undefined },
    { href: '/budget', title: 'Budget 2026', desc: 'Where the Government is spending.', Icon: Wallet, tint: '#fff6ed', ink: '#c2410c' },
    { href: '/news', title: 'Latest', desc: 'Election news and video.', Icon: Newspaper, tint: '#f0fdfa', ink: '#0d9488' },
    { href: '/learn', title: 'Learn the basics', desc: 'How voting and Parliament work.', Icon: GraduationCap, tint: '#fffbeb', ink: '#b45309' },
  ]

  return (
    <div style={{ backgroundColor: '#f4f2ec', backgroundImage: 'url(/back2.jpg)', backgroundRepeat: 'repeat-y', backgroundSize: '100% auto', backgroundPosition: 'top center', minHeight: '100vh' }}>
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
          background: t.tint, border: `1.5px solid ${t.ink}`, color: INK,
        }}>
          <t.Icon style={{ width: 24, height: 24, color: t.ink, marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em', color: t.ink, fontFamily: MANROPE }}>{t.title}</div>
          <div style={{ fontSize: 13, color: SUB, lineHeight: 1.45, marginTop: 3, fontFamily: MANROPE }}>{t.desc}</div>
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
