'use client'

/**
 * AllPartiesCompare — the every-party side-by-side comparison, which used to be
 * hidden behind a "Show all parties" toggle inside the issue panel. It's now its
 * own section below the electorate map with its OWN issue picker, independent of
 * the picker further up the page, so it always has something to show.
 */

import { useState } from 'react'
import { POLICY_TOPICS } from '@/constants/policy-topics'
import { PARTY_DIRECTORY_ORDER } from '@/constants/parties-data'
import { PartyPositions } from '@/components/policy/party-positions'
import { TopicChip } from '@/components/homepage/topic-chip'
import type { PartyPosition } from '@/lib/positions/live'
import { INK, MANROPE, SECONDARY } from '@/constants/theme'

export function AllPartiesCompare({ topicKeys, positions }: { topicKeys: string[]; positions: PartyPosition[] }) {
  // Defaults to the first issue rather than nothing, so the section is never an
  // empty box waiting on a tap.
  const [sel, setSel] = useState<string>(topicKeys[0])
  const topic = POLICY_TOPICS[sel as keyof typeof POLICY_TOPICS]

  // Newest wins: a 2026 entry beats an older one for the same party/topic.
  const getPos = (slug: string) => {
    let best: PartyPosition | undefined
    for (const p of positions) {
      if (p.party !== slug || p.topic !== sel) continue
      if (!best || (best.period !== '2026' && p.period === '2026')) best = p
    }
    return best
  }

  const hasData = positions.some((p) => p.topic === sel)

  return (
    <section style={{ background: 'transparent', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px) 56px' }}>
        <h2 style={{ fontSize: 'clamp(28px,5.5vw,32px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>
          Compare every party
        </h2>
        <p style={{ fontSize: 17, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 18px', lineHeight: 1.55 }}>
          Pick an issue to see all six side by side.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {topicKeys.map((key) => (
            <TopicChip key={key} topicKey={key} active={sel === key} onClick={() => setSel(key)} />
          ))}
        </div>

        {hasData ? (
          <PartyPositions parties={PARTY_DIRECTORY_ORDER} getPos={getPos} detailed={false} topic={sel} topicLabel={topic.label} />
        ) : (
          <p style={{ fontSize: 16, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55, margin: 0 }}>
            Party positions on {topic.label.toLowerCase()} are being sourced from official policy and editor-checked — they’ll appear here soon.
          </p>
        )}
      </div>
    </section>
  )
}
