'use client'

/**
 * CommandCentreTryIt — the "feel it in five seconds" island on the Command Centre
 * explainer. Real Track buttons for a handful of parties + issues (tracking works
 * anonymously via localStorage), plus a live tray that fills as you tap, so a
 * logged-out visitor experiences the payoff before ever making an account.
 */

import Link from 'next/link'
import { ArrowRight, Target } from 'lucide-react'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { useBookmarks, type BookmarkEntity } from '@/hooks/use-bookmarks'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa', BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function CommandCentreTryIt({ options }: { options: BookmarkEntity[] }) {
  const { bookmarks, user, loading } = useBookmarks()
  const n = bookmarks.length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
        {options.map((o) => (
          <div key={o.kind + o.refId} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${o.accent || JADE}`, borderRadius: 12, padding: '10px 12px', background: '#fff' }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>{o.label}</span>
              {o.sublabel && <span style={{ display: 'block', fontSize: 13, color: TERTIARY, fontFamily: MANROPE }}>{o.sublabel}</span>}
            </span>
            <BookmarkButton entity={o} variant="pill" />
          </div>
        ))}
      </div>

      {/* Live tray — fills as you tap Track. */}
      <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 14, background: n > 0 ? '#ecfdf5' : '#f8fafc', border: `1px solid ${n > 0 ? '#a7f3d0' : BORDER}`, transition: 'background .2s' }}>
        {loading ? (
          <span style={{ fontSize: 15, color: TERTIARY, fontFamily: MANROPE }}>Loading your tracked items…</span>
        ) : n === 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: SECONDARY, fontFamily: MANROPE }}>
            <Target style={{ width: 15, height: 15, color: TERTIARY }} /> Nothing tracked yet — tap <b style={{ color: INK }}>Track</b> on a few above and watch this fill up.
          </span>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Target style={{ width: 16, height: 16, color: JADE }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE }}>You&apos;re tracking {n} {n === 1 ? 'thing' : 'things'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
              {bookmarks.map((b) => (
                <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: INK, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 999, padding: '5px 11px', fontFamily: MANROPE }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: b.accent || JADE }} />
                  {b.label}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center' }}>
              {user ? (
                <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 15, fontWeight: 800, color: '#fff', background: JADE, borderRadius: 9, padding: '8px 14px', textDecoration: 'none', fontFamily: MANROPE }}>
                  Open your command centre <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              ) : (
                <>
                  <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 15, fontWeight: 800, color: '#fff', background: JADE, borderRadius: 9, padding: '8px 14px', textDecoration: 'none', fontFamily: MANROPE }}>
                    Save these — sign up free <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                  <span style={{ fontSize: 14, color: SECONDARY, fontFamily: MANROPE }}>They&apos;re saved on this device meanwhile.</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
