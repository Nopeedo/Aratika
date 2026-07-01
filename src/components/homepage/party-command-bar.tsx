'use client'

/**
 * PartyCommandBar — the party tiles, made persistent. A compact strip of the six
 * party-colour tiles that docks just under the navbar (top: 64) and slides in
 * once the big hero tiles have scrolled away, so it "travels" down the page with
 * you. It reads and writes the SAME shared choice as the hero tiles (usePartyCycle
 * → select / selectedSlug), so picking a party here focuses it everywhere that
 * listens (e.g. the policy hub). Tap the active tile again to clear the focus.
 * Neutral, fixed order; colour only — no ranking, no recommendation.
 */

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { usePartyCycle } from '@/components/homepage/party-cycle'

// slug, name, colour, isLight (light tiles need dark tick for contrast — e.g. ACT yellow)
const BAR: ReadonlyArray<readonly [string, string, string, boolean]> = [
  ['national', 'National', '#0A5BA8', false],
  ['labour', 'Labour', '#D5202B', false],
  ['green', 'Green', '#1F8A4C', false],
  ['act', 'ACT', '#F5C518', true],
  ['nzfirst', 'NZ First', '#181a1f', false],
  ['tpm', 'Te Pāti Māori', '#B11226', false],
]
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function PartyCommandBar() {
  const { selectedSlug, select } = usePartyCycle()
  const [show, setShow] = useState(false)

  // Reveal once the hero tiles section has fully scrolled above the viewport.
  useEffect(() => {
    const el = document.getElementById('party-tiles-anchor')
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      aria-hidden={!show}
      style={{
        position: 'fixed', top: 64, left: 0, right: 0, zIndex: 40,
        transform: show ? 'translateY(0)' : 'translateY(-130%)',
        transition: 'transform .34s cubic-bezier(.22,1,.36,1)',
        background: 'rgba(255,255,255,.9)', backdropFilter: 'saturate(1.4) blur(10px)',
        WebkitBackdropFilter: 'saturate(1.4) blur(10px)',
        borderBottom: '1px solid #ece8e1', boxShadow: '0 4px 16px rgba(0,0,0,.05)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '7px clamp(14px,4vw,24px)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6b5f54', fontFamily: MANROPE, whiteSpace: 'nowrap' }}>
          {selectedSlug ? 'Focused' : 'Pick a party'}
        </span>
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {BAR.map(([slug, name, color, light]) => {
            const on = selectedSlug === slug
            return (
              <button
                key={slug}
                onClick={() => select(on ? null : slug)}
                aria-label={name + (on ? ' — focused, tap to clear' : ' — focus this party')}
                aria-pressed={on}
                title={name}
                style={{
                  flex: '1 1 0', minWidth: 0, height: 28, borderRadius: 8, cursor: 'pointer', background: color,
                  border: on ? '2.5px solid #fff' : '2.5px solid transparent', padding: 0,
                  boxShadow: on ? `0 0 0 2px ${color}, 0 5px 12px rgba(0,0,0,.26)` : '0 1px 3px rgba(0,0,0,.14)',
                  transform: on ? 'translateY(-2px)' : 'none', transition: 'transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {on && <Check style={{ width: 15, height: 15, color: light ? '#2A1206' : '#fff' }} strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
