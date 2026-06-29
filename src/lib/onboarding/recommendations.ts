/**
 * buildPlan — turns a person's survey answers into a prioritised, reasoned set of
 * "here's how Aratika helps YOU" recommendations.
 *
 * Each rule fires off a specific answer and yields a recommendation with a
 * `reason` that quotes that answer back, plus a `weight` for ordering. We then
 * dedupe by destination (keeping the strongest reason) and sort. This is what
 * makes the survey result reactive — the page changes meaningfully with the
 * answers, pointing each person to the parts of the site that solve their
 * specific concern. Still non-partisan: we recommend *features*, never a vote.
 */

import type { Preferences } from '@/hooks/use-preferences'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PREMIUM_ENABLED } from '@/constants/features'

export interface Rec {
  href: string
  title: string
  reason: string
  icon: string      // lucide icon name, resolved in the component
  weight: number
  premium?: boolean
}

export function buildPlan(p: Preferences): Rec[] {
  const recs: Rec[] = []
  const top = p.topIssues[0] ?? p.issues[0] ?? null
  const topLabel = top ? POLICY_TOPICS[top].label : null
  const has = (g: Preferences['goals'][number]) => p.goals.includes(g)

  // ── Their #1 issue — the most concrete, personal payoff ──
  if (top && topLabel) {
    recs.push({
      href: `/policies/${top}`,
      title: `Where the parties stand on ${topLabel}`,
      reason: `${topLabel} is your top priority — compare every party's position on it, side by side and sourced.`,
      icon: 'Scale', weight: 96,
    })
  }

  // ── Goals (strongest intent signal) ──
  if (has('decide-vote')) {
    recs.push({ href: '/compare', title: 'Compare the parties side by side', reason: 'You want to work out who to vote for — line all six parties up on the issues.', icon: 'Scale', weight: 92 })
    recs.push({ href: '/map', title: 'Find your local MP', reason: 'See who represents you right now — and who’s standing in your seat in 2026.', icon: 'MapPin', weight: 90 })
  }
  if (has('understand')) {
    recs.push({ href: '/learn', title: 'Learn how it all works', reason: 'You want to understand the system — start with plain-language, interactive lessons.', icon: 'GraduationCap', weight: 91 })
  }
  if (has('accountability')) {
    recs.push({ href: '/bills', title: 'Track the bills in Parliament', reason: 'You want to keep politicians honest — follow the actual laws moving through the House.', icon: 'FileText', weight: 91 })
    recs.push({ href: '/take-action', title: 'Write to your MP', reason: 'Hold them to account directly — draft a letter or a select-committee submission.', icon: 'PenLine', weight: 76, premium: PREMIUM_ENABLED })
  }
  if (has('help-others')) {
    recs.push({ href: '/learn', title: 'The Kids & beginner lessons', reason: 'You’re helping someone else learn — bite-sized, friendly lessons for every age.', icon: 'GraduationCap', weight: 88 })
  }
  if (has('curious')) {
    recs.push({ href: '/parties', title: 'Meet the parties', reason: 'Just having a look? Start with who’s who in Parliament.', icon: 'Users', weight: 68 })
  }

  // ── Voting status ──
  if (p.votingStatus === 'never' || p.votingStatus === 'first-2026') {
    recs.push({
      href: '/learn/mmp',
      title: 'How voting actually works',
      reason: p.votingStatus === 'never'
        ? 'New to voting? Learn how MMP and your two votes work — in plain English, no jargon.'
        : 'Your first vote is coming in 2026 — here’s exactly how MMP and your two votes work.',
      icon: 'Vote', weight: 89,
    })
  }

  // ── Mood (tone + reassurance, routed to the right place) ──
  if (p.mood === 'sceptical') {
    recs.push({ href: '/mps', title: 'Check the receipts yourself', reason: 'Sceptical? Every MP profile is built from official records — don’t take our word for it.', icon: 'Eye', weight: 66 })
  }
  if (p.mood === 'overwhelmed') {
    recs.push({ href: '/learn', title: 'Start with one small lesson', reason: 'Feeling overwhelmed is normal — you don’t need to know everything. Start with a single 5-minute lesson.', icon: 'GraduationCap', weight: 66 })
  }
  if (p.mood === 'engaged') {
    recs.push({ href: '/battlegrounds', title: 'Explore the 2026 battlegrounds', reason: 'You follow politics closely — see which seats are on a knife-edge heading into 2026.', icon: 'Swords', weight: 64 })
  }

  // ── Comfort level ──
  if (p.level === 'beginner') {
    recs.push({ href: '/glossary', title: 'The plain-English glossary', reason: 'Hit a word you don’t know? Look up any political term in everyday language.', icon: 'BookOpen', weight: 48 })
  }
  if (p.level === 'expert') {
    recs.push({ href: '/elections', title: 'Dig into the election data', reason: 'Already clued up? Explore the full 2023 results and the 2026 race in detail.', icon: 'BarChart3', weight: 52 })
  }

  // ── Learning style ──
  if (p.learnStyles.includes('visual')) {
    recs.push({ href: '/map', title: 'The interactive electorate map', reason: 'You like things visual — explore New Zealand seat by seat.', icon: 'Map', weight: 46 })
  }
  if (p.learnStyles.includes('deep')) {
    recs.push({ href: '/bills', title: 'Go deep on the legislation', reason: 'You like the full picture — read exactly what each bill does and where it’s at.', icon: 'FileText', weight: 46 })
  }

  // dedupe by destination, keeping the highest-weight (strongest) reason
  const byHref = new Map<string, Rec>()
  for (const r of recs.sort((a, b) => b.weight - a.weight)) {
    if (!byHref.has(r.href)) byHref.set(r.href, r)
  }
  return [...byHref.values()].sort((a, b) => b.weight - a.weight)
}
