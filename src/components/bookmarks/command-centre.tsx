'use client'

/**
 * CommandCentre — the signed-in user's tracked things, grouped by kind.
 * Server-rendered initial list (passed in), with client-side removal so the
 * page stays live without a full reload. Free feature; the centrepiece of the
 * dashboard. Empty state nudges the user toward the things worth tracking.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Users, Landmark, MapPin, Scale, Gavel, X, ArrowRight, Map as MapIcon } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { PartySlug } from '@/types'
import type { Bookmark } from '@/hooks/use-bookmarks'

// Server enriches MP/party bookmarks with display details (photo, party, leader).
export type TrackedItem = Bookmark & { photo?: string; party?: string; role?: string; leader?: string }
const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

const GROUPS: { kind: Bookmark['kind']; label: string; icon: React.ElementType }[] = [
  { kind: 'mp', label: 'Tracked MPs', icon: Users },
  { kind: 'party', label: 'Tracked parties', icon: Landmark },
  { kind: 'policy', label: 'Tracked policy topics', icon: Scale },
  { kind: 'bill', label: 'Tracked bills', icon: Gavel },
  { kind: 'electorate', label: 'Tracked electorates', icon: MapPin },
]

function hrefFor(b: Bookmark): string {
  if (b.href) return b.href
  switch (b.kind) {
    case 'mp': return `/mps/${b.ref_id}`
    case 'party': return `/parties/${b.ref_id}`
    case 'policy': return `/policies/${b.ref_id}`
    case 'bill': return `/bills/${b.ref_id}`
    case 'electorate': return `/map?search=${encodeURIComponent(b.ref_id)}`
    default: return '/'
  }
}

export function CommandCentre({ initial }: { initial: TrackedItem[] }) {
  const [items, setItems] = useState<TrackedItem[]>(initial)

  async function remove(b: TrackedItem) {
    setItems((prev) => prev.filter((x) => !(x.kind === b.kind && x.ref_id === b.ref_id)))
    try {
      await fetch(`/api/bookmarks?kind=${encodeURIComponent(b.kind)}&ref=${encodeURIComponent(b.ref_id)}`, { method: 'DELETE' })
    } catch {
      setItems((prev) => [b, ...prev]) // restore on failure
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ border: `1px dashed ${TERTIARY}`, borderRadius: 16, padding: '28px 24px', background: SURFACE, textAlign: 'center' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <MapIcon style={{ width: 22, height: 22, color: JADE }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 6 }}>Your command centre is empty</div>
        <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 16px' }}>
          Track the MPs, parties, electorates and policy topics that matter to you, and they’ll all live here in one place — ready for the decision ahead.
        </p>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/map" style={cta(true)}><MapIcon style={{ width: 15, height: 15 }} /> Find your electorate</Link>
          <Link href="/mps" style={cta(false)}>Browse MPs <ArrowRight style={{ width: 15, height: 15 }} /></Link>
          <Link href="/compare" style={cta(false)}>Compare parties <ArrowRight style={{ width: 15, height: 15 }} /></Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {GROUPS.map(({ kind, label, icon: Icon }) => {
        const group = items.filter((b) => b.kind === kind)
        if (group.length === 0) return null
        return (
          <div key={kind}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon style={{ width: 16, height: 16, color: JADE }} />
              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>{label}</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE }}>{group.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
              {group.map((b) => {
                const sub = b.role || b.sublabel
                return (
                  <div key={b.id} className="party-card" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '12px 14px', background: '#fff', overflow: 'hidden' }}>
                    <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: b.accent || JADE }} />
                    <Link href={hrefFor(b)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', paddingLeft: 4 }}>
                      {b.kind === 'mp' ? (
                        <Avatar name={b.label} party={b.party as PartySlug | undefined} src={b.photo} size="md" />
                      ) : b.kind === 'party' ? (
                        <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: b.accent || JADE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, fontFamily: MANROPE }}>{initials(b.label)}</span>
                      ) : (
                        <span style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: SURFACE, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: b.accent || JADE }}>
                          {b.kind === 'electorate' ? <MapPin style={{ width: 18, height: 18 }} /> : b.kind === 'bill' ? <Gavel style={{ width: 18, height: 18 }} /> : <Scale style={{ width: 18, height: 18 }} />}
                        </span>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: INK, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</div>
                        {sub && <div style={{ fontSize: 12, color: TERTIARY, fontFamily: MANROPE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
                      </div>
                    </Link>
                    <button
                      onClick={() => remove(b)}
                      aria-label={`Stop tracking ${b.label}`}
                      style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: TERTIARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function cta(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
    fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
    background: primary ? JADE : '#fff', color: primary ? '#fff' : INK,
    border: primary ? 'none' : `1px solid ${BORDER}`,
  }
}
