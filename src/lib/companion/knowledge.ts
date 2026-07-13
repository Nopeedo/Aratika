/**
 * The "Ask Arapono" knowledge base. A flat corpus assembled from Arapono's own
 * data (parties, MPs, bills, policies, learn modules, glossary, and a site map).
 * The companion answers ONLY from retrieved items here — this is what keeps it
 * grounded and citable rather than relying on the model's memory.
 *
 * Retrieval is lexical (term-overlap scoring) — no embeddings needed for v1.
 */

import { PARTY_PROFILES, PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { MP_PROFILES } from '@/constants/mps-data'
import { BILLS } from '@/constants/bills-data'
import { POLICY_TOPICS, POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { LEARN_MODULES } from '@/constants/learn-data'
import { GLOSSARY } from '@/constants/glossary'

export interface KnowledgeItem {
  id: string
  type: 'party' | 'mp' | 'bill' | 'policy' | 'learn' | 'term' | 'page'
  title: string
  text: string
  href: string
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s)

// ─── static site map — helps with "where do I find…" and "explain this page" ──
const PAGES: KnowledgeItem[] = [
  { id: 'page-map', type: 'page', title: 'Interactive electorate map', text: 'Click any part of New Zealand to see who represents that area, their party, and electorate. General and Māori electorate layers.', href: '/map' },
  { id: 'page-mps', type: 'page', title: 'MPs directory', text: 'A searchable, filterable directory of all 123 current Members of Parliament with profiles.', href: '/mps' },
  { id: 'page-parties', type: 'page', title: 'Parties overview', text: 'All six parliamentary parties plus profiles — leaders, history, values and key policy areas.', href: '/parties' },
  { id: 'page-policies', type: 'page', title: 'Policy comparison', text: 'Compare where each party stands across the major policy topics, side by side, from official party material.', href: '/policies' },
  { id: 'page-compare', type: 'page', title: 'Compare parties', text: 'Put parties side by side on the issues to see their positions together.', href: '/compare' },
  { id: 'page-bills', type: 'page', title: 'Bills tracker', text: 'Bills currently before the House — their type, stage, and what they propose.', href: '/bills' },
  { id: 'page-learn', type: 'page', title: 'Learn how Parliament works', text: 'Interactive lessons from beginner to expert: MMP, your two votes, how a bill becomes law, select committees and more. Also a Kids tier.', href: '/learn' },
  { id: 'page-take-action', type: 'page', title: 'Take Action studio', text: 'Draft a letter to your MP or a Minister, make a select-committee submission, or file an Official Information Act (OIA) request. A Premium feature.', href: '/take-action' },
  { id: 'page-elections', type: 'page', title: 'Elections', text: 'Official 2023 results and the upcoming 2026 general election, nationally and by electorate.', href: '/elections' },
  { id: 'page-battlegrounds', type: 'page', title: 'Battlegrounds', text: 'A marginality map of the electorates and per-seat pages tracking incumbents and 2026 candidates.', href: '/battlegrounds' },
  { id: 'page-parliament', type: 'page', title: 'Parliament overview', text: 'A snapshot of the current Parliament — seat distribution, the government, and the opposition.', href: '/parliament' },
  { id: 'page-glossary', type: 'page', title: 'Glossary', text: 'Plain-language definitions of New Zealand political terms.', href: '/glossary' },
  { id: 'page-start', type: 'page', title: 'Find what matters to you', text: 'A short walkthrough that finds the issues you care about and builds you a personalised plan.', href: '/start' },
  { id: 'page-plan', type: 'page', title: 'Your plan', text: 'Your personalised, tick-as-you-go plan of the parts of Arapono that help you most.', href: '/plan' },
]

// ─── build the corpus once ────────────────────────────────────────────────────
function build(): KnowledgeItem[] {
  const items: KnowledgeItem[] = []

  for (const slug of PARTY_DIRECTORY_ORDER) {
    const p = PARTY_PROFILES[slug]
    if (!p || slug === 'independent') continue
    items.push({
      id: `party-${slug}`, type: 'party', title: p.name, href: `/parties/${slug}`,
      text: clip(`${p.fullName}. ${p.tagline}. Leader: ${p.leader} (${p.leaderTitle})${p.coLeader ? `, co-leader ${p.coLeader}` : ''}. Currently ${p.status}${p.coalitionRole ? ` — ${p.coalitionRole}` : ''}, ${p.seats} seats. ${p.overview} Ideology: ${p.ideology.join(', ')}. Key policy areas: ${p.keyPolicyAreas.join(', ')}.`, 520),
    })
  }

  for (const mp of Object.values(MP_PROFILES)) {
    if (mp.status !== 'active') continue
    const role = mp.role === 'electorate' ? `electorate MP for ${mp.electorate}` : 'list MP'
    const party = PARTY_PROFILES[mp.party]?.name ?? mp.party
    items.push({
      id: `mp-${mp.slug}`, type: 'mp', title: mp.name, href: `/mps/${mp.slug}`,
      text: clip(`${mp.fullName}, ${party} ${role}.${mp.title ? ` ${mp.title}.` : ''}${mp.enteredParliament ? ` In Parliament since ${mp.enteredParliament}.` : ''}${mp.portfolios?.length ? ` Portfolios: ${mp.portfolios.join(', ')}.` : ''}${mp.bio ? ` ${mp.bio}` : ''}`, 360),
    })
  }

  for (const b of BILLS) {
    items.push({
      id: `bill-${b.slug}`, type: 'bill', title: b.title, href: `/bills/${b.slug}`,
      text: clip(`${b.title} (${b.number}), a ${b.kind} bill currently at the ${b.stage} stage${b.selectCommittee ? ` (${b.selectCommittee})` : ''}. ${b.summary}`, 320),
    })
  }

  for (const key of POLICY_TOPIC_ORDER) {
    const t = POLICY_TOPICS[key]
    items.push({
      id: `policy-${key}`, type: 'policy', title: `${t.label} (policy)`, href: `/policies/${key}`,
      text: clip(`${t.label}: ${t.description}. ${t.longDescription} See where each party stands on ${t.label}.`, 460),
    })
  }

  for (const m of LEARN_MODULES) {
    if (m.status !== 'live') continue
    const intro = (m.tiers.beginner?.intro ?? []).map((b) => b.body).join(' ')
    items.push({
      id: `learn-${m.id}`, type: 'learn', title: `Learn: ${m.title}`, href: `/learn/${m.id}`,
      text: clip(`${m.title} — ${m.subtitle}. ${intro}`, 460),
    })
  }

  for (const g of GLOSSARY) {
    items.push({
      id: `term-${g.term}`, type: 'term', title: g.term, href: g.learn?.href ?? '/glossary',
      text: clip(`${g.term}: ${g.def}`, 280),
    })
  }

  return [...items, ...PAGES]
}

export const KNOWLEDGE: KnowledgeItem[] = build()

// ─── retrieval ────────────────────────────────────────────────────────────────
const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'of', 'to', 'in', 'on', 'and', 'or', 'for', 'what', 'who', 'how', 'do', 'does', 'i', 'my', 'me', 'can', 'about', 'with', 'this', 'that', 'it', 'whats', 'tell', 'explain', 'where', 'when', 'which', 'should'])

function tokens(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9āēīōū]+/).filter((t) => t.length >= 2 && !STOP.has(t))
}

export function retrieve(query: string, limit = 8): KnowledgeItem[] {
  const q = tokens(query)
  if (q.length === 0) return []
  const phrase = query.toLowerCase().trim()

  const scored = KNOWLEDGE.map((item) => {
    const title = item.title.toLowerCase()
    const text = item.text.toLowerCase()
    let score = 0
    for (const t of q) {
      if (title.includes(t)) score += 3
      if (text.includes(t)) score += 1
    }
    if (phrase.length > 4 && title.includes(phrase)) score += 6
    return { item, score }
  }).filter((s) => s.score > 0)

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.item)
}

/** Format retrieved items as a CONTEXT block for the model. */
export function formatContext(items: KnowledgeItem[]): string {
  if (items.length === 0) return '(no matching Arapono content found)'
  return items.map((it, i) => `[${i + 1}] ${it.title} — ${it.text} (link: ${it.href})`).join('\n')
}
