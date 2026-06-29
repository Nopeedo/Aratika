'use client'

/**
 * PartyCycleProvider — a single shared "clock" so the hero accent colour and the
 * party-tiles panel advance in lockstep. Starts on National (blue), fades through
 * each party every 3.2s, and stops the moment the user taps a tile (select()).
 * Both the hero ("in your hands") and the tiles read the same slug/colour/fade.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

const ORDER = ['national', 'labour', 'green', 'act', 'nzfirst', 'tpm'] as const
const COLORS: Record<string, string> = {
  national: '#0A5BA8', labour: '#D5202B', green: '#1F8A4C', act: '#F5C518', nzfirst: '#181a1f', tpm: '#B11226',
}

interface PartyCycle {
  panelSlug: string | null   // which party panel to show (null = closed by the user)
  accentColor: string        // current accent colour for the title
  fading: boolean            // true during the brief swap — both the title and panel fade together
  fadeMs: number             // duration of the current fade (shorter for the first transition on load)
  select: (slug: string | null) => void
}

const Ctx = createContext<PartyCycle | null>(null)

export function usePartyCycle(): PartyCycle {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePartyCycle must be used within PartyCycleProvider')
  return c
}

export function PartyCycleProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)            // 0 = National (blue) first
  const [fading, setFading] = useState(false)
  const [fadeMs, setFadeMs] = useState(850)
  const [autoplay, setAutoplay] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!autoplay || reduce) return
    // First cycle (National) holds ~50% shorter with a quicker fade on load; normal pace after.
    const FIRST_HOLD = 1200, FIRST_FADE = 450, HOLD = 2350, FADE = 850
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>
    let cancelled = false
    let first = true
    const advance = () => {
      if (cancelled) return
      const dur = first ? FIRST_FADE : FADE
      setFadeMs(dur)
      setFading(true)
      t2 = setTimeout(() => {
        if (cancelled) return
        setIndex((i) => (i + 1) % ORDER.length)
        setFading(false)
        first = false
        t1 = setTimeout(advance, HOLD)
      }, dur)
    }
    t1 = setTimeout(advance, FIRST_HOLD)
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2) }
  }, [autoplay, reduce])

  const select = (slug: string | null) => { setAutoplay(false); setFading(false); setSelected(slug) }

  const cycleSlug = ORDER[index]
  const panelSlug = autoplay ? cycleSlug : selected
  const accentColor = COLORS[autoplay ? cycleSlug : (selected ?? cycleSlug)]

  return (
    <Ctx.Provider value={{ panelSlug, accentColor, fading: autoplay && fading, fadeMs, select }}>
      {children}
    </Ctx.Provider>
  )
}
