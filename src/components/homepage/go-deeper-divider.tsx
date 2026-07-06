/**
 * GoDeeperDivider — a quiet signpost between the beginner tier (the essentials
 * everyone needs) and the deeper, more engaged sections below. It tells a
 * first-timer "you've got what you need; the rest is here when you want it," so
 * the horse-race and tracking content reads as optional depth, not a wall.
 */

import { ChevronDown } from 'lucide-react'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#c9c6bf'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function GoDeeperDivider() {
  return (
    <section style={{ background: '#fff' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px clamp(18px, 5vw, 36px) 8px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: SECONDARY, fontFamily: MANROPE }}>
            Following the race? Go deeper
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: INK, fontFamily: MANROPE, maxWidth: 460, lineHeight: 1.55 }}>
            You&apos;ve got the essentials. Below is where things stand, what to keep an eye on, and how to follow it all the way to election day.
          </span>
          <ChevronDown style={{ width: 20, height: 20, color: TERTIARY, marginTop: 4 }} />
        </div>
      </div>
    </section>
  )
}
