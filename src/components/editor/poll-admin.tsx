'use client'

/**
 * PollAdmin — editor UI to enter a poll (pollster, fieldwork, date, source, and a
 * party-vote % per party) and to remove existing ones. Writes go through
 * /api/editor/polls (service-role, after an editor check). On success we
 * router.refresh() so the list and the public Election Centre pick up the change.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { POLL_PARTIES } from '@/constants/polls-data'
import { PARTY_NAMES, PARTY_COLORS } from '@/constants/parties'
import type { PartySlug } from '@/types'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export interface EditorPoll {
  id: string
  pollster: string
  fieldwork: string
  date: string
  sourceUrl: string
  parties: Record<string, number>
}

const emptyParties = () => Object.fromEntries(POLL_PARTIES.map((p) => [p, ''])) as Record<string, string>

export function PollAdmin({ initial }: { initial: EditorPoll[] }) {
  const router = useRouter()
  const [pollster, setPollster] = React.useState('')
  const [fieldwork, setFieldwork] = React.useState('')
  const [date, setDate] = React.useState('')
  const [sourceUrl, setSourceUrl] = React.useState('')
  const [pct, setPct] = React.useState<Record<string, string>>(emptyParties)
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const parties: Record<string, number> = {}
    for (const p of POLL_PARTIES) {
      const n = parseFloat(pct[p])
      if (!isNaN(n)) parties[p] = n
    }
    const res = await fetch('/api/editor/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollster, fieldwork, date, sourceUrl, parties }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMsg({ ok: true, text: 'Poll saved — it’s live in the poll-of-polls.' })
      setPollster(''); setFieldwork(''); setDate(''); setSourceUrl(''); setPct(emptyParties())
      router.refresh()
    } else {
      setMsg({ ok: false, text: json.message || 'Could not save the poll.' })
    }
  }

  async function remove(id: string) {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/editor/polls', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setBusy(false)
    if (res.ok) router.refresh()
    else setMsg({ ok: false, text: 'Could not remove that poll.' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {/* Entry form */}
      <form onSubmit={submit} style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Add a poll</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <Field label="Pollster *"><input value={pollster} onChange={(e) => setPollster(e.target.value)} placeholder="1News–Verian" style={inp} required /></Field>
          <Field label="Fieldwork dates"><input value={fieldwork} onChange={(e) => setFieldwork(e.target.value)} placeholder="13–17 Jun 2026" style={inp} /></Field>
          <Field label="Poll date *"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} required /></Field>
          <Field label="Source URL"><input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" style={inp} /></Field>
        </div>

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: SECONDARY, fontFamily: MANROPE, marginBottom: 8 }}>Party vote (%)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {POLL_PARTIES.map((p) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '6px 10px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: PARTY_COLORS[p].bg, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: MANROPE, flex: 1, minWidth: 0 }}>{PARTY_NAMES[p as PartySlug].short}</span>
                <input type="number" step="0.1" min="0" max="100" value={pct[p]} onChange={(e) => setPct((s) => ({ ...s, [p]: e.target.value }))} placeholder="—" style={{ ...inp, width: 62, padding: '6px 8px', textAlign: 'right' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button type="submit" disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11, border: 'none', background: JADE, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: MANROPE, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? <Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> : <Plus style={{ width: 15, height: 15 }} />} Save poll
          </button>
          {msg && <span style={{ fontSize: 13, fontWeight: 700, color: msg.ok ? JADE : '#b91c1c', fontFamily: MANROPE }}>{msg.text}</span>}
        </div>
      </form>

      {/* Existing polls */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 10 }}>
          In the average ({initial.length})
        </div>
        {initial.length === 0 ? (
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE }}>
            No polls entered yet — the Election Centre is showing the bundled starter set until you add the first one.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {initial.map((poll) => (
              <div key={poll.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 160, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{poll.pollster}</div>
                  <div style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE }}>{poll.fieldwork || poll.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 2, minWidth: 200 }}>
                  {POLL_PARTIES.filter((p) => typeof poll.parties[p] === 'number').map((p) => (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: MANROPE, background: SURFACE, borderRadius: 999, padding: '3px 9px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: PARTY_COLORS[p].bg }} />
                      <b style={{ color: INK }}>{poll.parties[p]}</b>
                    </span>
                  ))}
                </div>
                {poll.sourceUrl && (
                  <a href={poll.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: TERTIARY, display: 'inline-flex' }} aria-label="Source"><ExternalLink style={{ width: 15, height: 15 }} /></a>
                )}
                <button onClick={() => remove(poll.id)} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 9, border: `1px solid ${BORDER}`, background: '#fff', color: '#b91c1c', fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, cursor: 'pointer' }}>
                  <Trash2 style={{ width: 13, height: 13 }} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE }}>{label}</span>
      {children}
    </label>
  )
}

const inp: React.CSSProperties = { height: 38, borderRadius: 9, border: `1px solid ${BORDER}`, padding: '0 11px', fontSize: 14, fontFamily: MANROPE, color: INK, background: '#fff', width: '100%' }
