'use client'

/**
 * EmailToggle — the weekly email switch, on the dashboard beside notifications.
 *
 * Until now the only way off the list was the one-click link inside the email.
 * That is enough to satisfy the unsubscribe requirement, but it fails the person
 * who deleted the email, never received one, or just wants to see what they are
 * signed up to. The newsletter is opt-out, so it is the setting most likely to
 * surprise someone — which makes it the one that should be easiest to find.
 *
 * Seeded from the server so it renders in its true state rather than flashing
 * the wrong one and correcting itself.
 */

import { useState } from 'react'
import { Mail, MailX, Loader2, Check } from 'lucide-react'
import { BORDER, INK, JADE, MANROPE } from '@/constants/theme'

const SUB = '#5b6067'

export function EmailToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function set(next: boolean) {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/newsletter/prefs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (!res.ok) throw new Error()
      setEnabled(next)
    } catch {
      setError('Couldn’t save that. Please try again.')
    }
    setBusy(false)
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', background: '#fff', fontFamily: MANROPE }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 11, background: enabled ? '#ecfdf5' : '#f4f6f8', flexShrink: 0 }}>
          {enabled ? <Mail style={{ width: 20, height: 20, color: JADE }} /> : <MailX style={{ width: 20, height: 20, color: SUB }} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>The Arapono Weekly</div>
          <p style={{ fontSize: 13.5, color: SUB, lineHeight: 1.5, margin: '3px 0 0' }}>
            One email a week: what moved in Parliament, what’s coming up, and news on the things you follow.
            {' '}Nothing else — we don’t sell or share your address.
          </p>

          {error && <div style={{ marginTop: 10, fontSize: 13, color: '#991b1b' }}>{error}</div>}

          <div style={{ marginTop: 14 }}>
            {enabled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: JADE }}>
                  <Check style={ic} /> You’re subscribed
                </span>
                <button onClick={() => set(false)} disabled={busy} style={btn(false)}>
                  {busy ? <Loader2 className="live-dot" style={ic} /> : <MailX style={ic} />} Unsubscribe
                </button>
              </div>
            ) : (
              <button onClick={() => set(true)} disabled={busy} style={btn(true)}>
                {busy ? <Loader2 className="live-dot" style={ic} /> : <Mail style={ic} />} Send me the weekly
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ic: React.CSSProperties = { width: 15, height: 15 }
function btn(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 11,
    fontFamily: MANROPE, fontSize: 14, fontWeight: 800, cursor: 'pointer',
    border: primary ? 'none' : `1px solid ${BORDER}`,
    background: primary ? INK : '#fff', color: primary ? '#fff' : SUB,
  }
}
