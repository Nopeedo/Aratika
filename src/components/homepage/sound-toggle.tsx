'use client'

/**
 * SoundToggle — optional ambient/cinematic audio. OFF by default, never autoplays
 * (autoplay is bad UX + an accessibility issue). Only appears if an audio file is
 * present at /sound/ambient.mp3, so it degrades gracefully when none is added.
 */

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

const SRC = '/sound/ambient.mp3'

export function SoundToggle() {
  const [ready, setReady] = useState(false)
  const [on, setOn] = useState(false)
  const ref = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const a = new Audio(SRC)
    a.loop = true
    a.volume = 0.32
    a.preload = 'auto'
    a.addEventListener('canplaythrough', () => setReady(true), { once: true })
    a.addEventListener('error', () => setReady(false))
    ref.current = a
    return () => { a.pause() }
  }, [])

  if (!ready) return null

  function toggle() {
    const a = ref.current
    if (!a) return
    if (on) { a.pause(); setOn(false) }
    else { a.play().then(() => setOn(true)).catch(() => setReady(false)) }
  }

  return (
    <button
      onClick={toggle}
      aria-label={on ? 'Turn ambient sound off' : 'Turn ambient sound on'}
      title={on ? 'Sound on' : 'Sound off'}
      style={{
        position: 'fixed', right: 20, bottom: 20, zIndex: 55,
        width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
        background: on ? '#1F8A4C' : 'rgba(12,14,18,.85)', color: '#fff', border: '1px solid rgba(255,255,255,.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(12,14,18,.25)',
      }}
    >
      {on ? <Volume2 style={{ width: 19, height: 19 }} /> : <VolumeX style={{ width: 19, height: 19 }} />}
    </button>
  )
}
