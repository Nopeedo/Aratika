'use client'

/**
 * ExploreCarousel — the homepage's single "everything else" surface. The core of
 * the page is now just the tiles, the policy topics and the map; every other
 * feature (the race, news, battlegrounds, bills, budget, tracking, learn) is
 * demoted to a card in this horizontal rail with a link through to its full page.
 * Keeps the homepage short while still signposting the whole toolkit.
 *
 * Cards are feature-gated so a card only appears when its route is live in the
 * current launch phase (see constants/features).
 */

import * as React from 'react'
import {
  BarChart3, Scale, FileText,
  Newspaper, Swords, Vote, LayoutDashboard, GraduationCap,
  Users, UserSquare2, Map, Landmark, TrendingUp, Megaphone, Compass, ListChecks, BookOpen,
} from 'lucide-react'
import { isEnabled } from '@/constants/features'
import { SignLink } from '@/components/homepage/compare-sign-link'
import { usePartyCycle } from '@/components/homepage/party-cycle'
import { INK, MANROPE } from '@/constants/theme'

/** Body grey, for the group labels. */
const SUB = '#5b6067'

/* GUTTER lived here: the full-bleed inset that lined the card rail up with the
   centred container. The signposts sit in the container itself now. */

/** hex -> rgba, for the feathered wash behind the heading. */
function rgba(hex: string, a: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

interface Feature {
  feature: string
  title: string
  desc: string
  href: string
  Icon: React.ComponentType<{ style?: React.CSSProperties }>
  tint: string
}

/**
 * Grouped by what the reader is trying to DO, not by what kind of page it is.
 *
 * Fourteen signposts in one column is a list to be got through; the same
 * fourteen under four short headings is four short decisions. The order
 * within each group runs from the thing most people want to the thing fewest
 * do, and the groups themselves run in the order a voter meets them: work out
 * who, check your own patch, keep up, and — for anyone still at the door —
 * the basics.
 */
const GROUPS: { label: string; items: Feature[] }[] = [
  {
    label: 'Work out your vote',
    items: [
      // Named for the page it opens ("Party Policy Comparison"), not for what
      // the link does: a reader who taps "Compare parties" and lands on a
      // heading with a different name has to work out they are in the right
      // place.
      { feature: 'policies', title: 'Party Policy Comparison', desc: 'Every party, side by side on the issues', href: '/policies', Icon: Scale, tint: '#f2fbf6' },
      // "Every party" read as a duplicate of the six tiles above. The page's
      // job is the way into each party's own profile — including the eleven
      // registered parties with no seats, who have nowhere else on the
      // homepage to be found.
      { feature: 'parties', title: 'Party profiles', desc: 'Every party contesting 2026, in Parliament and outside it', href: '/parties', Icon: Users, tint: '#eef2ff' },
      // What they have actually put before the House, next to what they say
      // they stand for: a bill is a promise a party has had to act on. Above
      // the questionnaire by request — it sits with the two comparison tools
      // it belongs with, and the questionnaire asks something of the reader
      // where the other three just show them something.
      { feature: 'bills', title: 'All bills directory', desc: 'Every bill this term, and where it has got to', href: '/bills', Icon: FileText, tint: '#fdf4ff' },
      { feature: 'onboarding', title: 'Find what matters to you', desc: 'Twelve questions, and where you stand', href: '/start', Icon: Compass, tint: '#f2fbf6' },
    ],
  },
  {
    label: 'Where you live',
    items: [
      { feature: 'map', title: 'Electorate map', desc: 'Find your electorate and your MP', href: '/map', Icon: Map, tint: '#ecfeff' },
      { feature: 'mps', title: 'MPs directory', desc: 'Every current MP, by name or electorate', href: '/mps', Icon: UserSquare2, tint: '#f0f9ff' },
      { feature: 'battlegrounds', title: 'Battlegrounds', desc: 'The marginal seats that decide the election', href: '/battlegrounds', Icon: Swords, tint: '#fef2f2' },
    ],
  },
  {
    label: 'Keep up, and have your say',
    items: [
      { feature: 'elections', title: 'Election Centre', desc: 'Polls, seat projection & live results on the night', href: '/elections/2026', Icon: BarChart3, tint: '#eef4ff' },
      { feature: 'polls', title: 'Public polls', desc: 'What the polls are saying', href: '/polls', Icon: TrendingUp, tint: '#fef2f2' },
      { feature: 'parliament', title: 'Parliament now', desc: 'Seats, cabinet and the current snapshot', href: '/parliament', Icon: Landmark, tint: '#f5f3ff' },
      { feature: 'dashboard', title: 'Track what matters', desc: 'Follow the parties & MPs you care about', href: '/command-centre', Icon: LayoutDashboard, tint: '#f0fdfa' },
      { feature: 'take-action', title: 'Take action', desc: 'Submissions, and how to have your say', href: '/take-action', Icon: Megaphone, tint: '#fff7ed' },
      { feature: 'news', title: 'Latest news & video', desc: 'Election coverage across every party', href: '/news', Icon: Newspaper, tint: '#eff6ff' },
    ],
  },
  {
    label: 'New to this?',
    items: [
      { feature: 'onboarding', title: 'Get ready to vote', desc: 'Enrol, and learn how it all works', href: '/guide', Icon: Vote, tint: '#f2fbf6' },
      { feature: 'onboarding', title: 'Your plan', desc: 'What to do before election day', href: '/plan', Icon: ListChecks, tint: '#f0fdfa' },
      { feature: 'learn', title: 'Learn the basics', desc: 'How voting and Parliament work', href: '/learn', Icon: GraduationCap, tint: '#faf5ff' },
      { feature: 'glossary', title: 'Glossary', desc: 'The words politics uses, in plain English', href: '/glossary', Icon: BookOpen, tint: '#faf5ff' },
    ],
  },
]

export function ExploreCarousel() {
  const { accentColor } = usePartyCycle()
  // Drop anything gated off in this launch phase, then drop a group that has
  // nothing left in it.
  const groups = GROUPS
    .map((g) => ({ ...g, items: g.items.filter((f) => isEnabled(f.feature)) }))
    .filter((g) => g.items.length > 0)
  if (groups.length === 0) return null

  return (
    // No rule across the top: the heading and the space above it are what
    // separate this from the section before, the way every other break on the
    // page works. A hairline read as the page ENDING rather than a section
    // starting.
    <section style={{ background: 'transparent' }}>
      {/* 18px of air above the heading, not 48: the section before already
          carries 26px of its own under its last signpost, so the two stacked
          into a gap wide enough to read as the page having ended. */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '18px clamp(18px, 5vw, 36px) 22px' }}>
        {/* Header + desktop arrows */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            {/* No eyebrow. "The rest of the toolkit" was removed by request —
                "Explore more" already says it, and the eyebrow was the only
                place on the homepage the site called itself a toolkit. */}
            {/* The page's section-heading size, shared with "What does
                {party} stand for?", the coverage heading and the 2023-term
                one. At clamp(24,3.4vw,30) this sat a size below all of them
                and read as a footer rather than a section. */}
            {/* The same feathered wash the policy and 2023-term headings sit
                on: a radial of the current party's colour, so it fades on
                every edge instead of stopping on a line. */}
            <div style={{ position: 'relative', isolation: 'isolate', display: 'inline-block' }}>
              <div aria-hidden style={{
                position: 'absolute', left: '-12%', right: '-12%', top: '-40%', bottom: '-40%',
                background: `radial-gradient(ellipse at center, ${rgba(accentColor, 0.2)}, ${rgba(accentColor, 0)} 70%)`,
                transition: 'background .3s ease-in-out', pointerEvents: 'none', zIndex: -1,
              }} />
              <h2 style={{ position: 'relative', fontSize: 'clamp(28px,5.5vw,32px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>Explore Politika&rsquo;s tools</h2>
            </div>
            {/* No sub-line: nine signposts under the heading say what this is
                more plainly than a sentence about them did. */}
          </div>
        </div>
      </div>

      {/* A stack of signposts, not a rail of cards.
          The cards carried a description each and scrolled sideways, which on
          a phone meant one and a half of them on screen and the rest found by
          swiping. These are the same destinations as one line apiece, in the
          shape the rest of the page uses for "this way out", with the tool's
          own icon in a circle at the head of each. */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {groups.map((g) => (
          <div key={g.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: SUB, fontFamily: MANROPE }}>
              {g.label}
            </div>
            {/* One per row. The signpost's tapered end eats into the label,
                so in two columns the longer names wrapped to two lines and
                the points ran at the gap between them. A sign wants the width
                it needs and nothing beside it. */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, width: '100%' }}>
              {g.items.map((f) => (
                <SignLink
                  key={f.href}
                  href={f.href}
                  icon={
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: f.tint,
                    }}>
                      <f.Icon style={{ width: 14, height: 14, color: INK }} />
                    </span>
                  }
                >
                  {f.title}
                </SignLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .ec-rail::-webkit-scrollbar { display: none; }
        .ec-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(12,14,18,.10); border-color: #dcdad5; }
        @media (max-width: 720px) { .ec-arrows { display: none !important; } }
      `}</style>
    </section>
  )
}

/* arrowBtn lived here: the left/right controls for the card rail. The rail is
   a stack of signposts now, so there is nothing to scroll. */

