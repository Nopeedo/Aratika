'use client'

/**
 * LearnProgressBanner — how far the reader has got on /learn, and the account
 * ask that goes with it.
 *
 * Three things changed on 23 September, and the third is the one that matters.
 *
 * 1. It no longer renders at all until something has been finished. It used to
 *    open the page with a 42px tile, "Start learning to earn XP and badges" and
 *    a three-line sub, shown to a reader with zero progress who had not yet met
 *    a module. That is 199px of chrome describing a scoring system before the
 *    thing being scored (§1.1, §6.1). On a first visit the modules now start at
 *    the top of the content column.
 *
 * 2. The XP vocabulary is gone from the visible copy. "XP", "Level 3" and a
 *    level bar are a scoring language that appears nowhere else on Politika,
 *    and "level" was doing two jobs on one page: the XP level here, and the
 *    four difficulty levels (Kids to Expert) on every module. One meaning per
 *    word (§1.3, §4). The bar now fills on levels finished, which is a number
 *    the reader can see the parts of on the cards below.
 *
 * 3. §2.13: the ask happens ON THE PAGE, never a navigation. It used to say
 *    "Progress saved on this device. Sign in to save it across devices." with a
 *    <Link href="/login">, which is both the promise §2.13 struck and the page
 *    change §2.13 replaced. The dialog is the SHARED AccountDialog from
 *    track-with-account.tsx, imported, not a second copy of it.
 *
 * A deliberate divergence from the letter of §2.13, argued rather than assumed:
 * the local save STAYS. §2.13 removed anonymous tracking because a track that
 * lives in one browser "cannot be told to anyone when a position changes", so
 * the tick was a promise that could not be kept. Learn progress promises
 * nothing but itself: it is a per-viewer convenience, like a remembered tab,
 * and useLearnProgress already merges local into cloud on sign-in, so nothing
 * is lost by keeping it. What had to change is the sentence. "Progress saved on
 * this device" reads as a guarantee; "Saved in this browser" is what is true.
 *
 * Progress arrives as props rather than from useLearnProgress here, so the hook
 * runs once on the hub (in hub-modules.tsx) instead of twice. Two consumers
 * meant two cloud pulls and two merge-and-upsert passes on every sign-in.
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Award, Cloud, CloudOff } from 'lucide-react'
import { AccountDialog } from '@/components/bookmarks/track-with-account'
import type { Badge } from '@/lib/learn/xp'
import { BORDER, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

export function LearnProgressBanner({ done, total, badges, loaded, isSynced }: {
  /** Difficulty levels finished, across every live module. */
  done: number
  /** Levels there are to finish. */
  total: number
  badges: Badge[]
  /** False until progress has been read, so nothing flashes on first paint. */
  loaded: boolean
  /** Signed in: progress is on the account as well as in this browser. */
  isSynced: boolean
}) {
  const [ask, setAsk] = React.useState(false)

  // Nothing finished, nothing to report. See (1) in the note above.
  if (!loaded || done === 0) return null

  const pct = total > 0 ? (done / total) * 100 : 0

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, background: SURFACE, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 190, flex: 1 }}>
          {/* The roll-up, in the site's own words. The parts of it are on the
              module cards below, the way /bills states "152 now law" over a
              list whose tiles each carry their own status. */}
          <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 7 }}>
            {done} of {total} levels done
          </div>
          <div style={{ height: 8, borderRadius: 5, background: '#eceae5', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{ height: '100%', background: JADE, borderRadius: 5 }}
            />
          </div>
        </div>

        {/* Badges stay: unlike XP they name the modules they came from, so each
            one is a fact about what the reader has actually done. */}
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 360 }}>
            {badges.map((b) => (
              <span key={b.moduleId} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 999, padding: '4px 10px', fontFamily: MANROPE }}>
                <Award style={{ width: 12, height: 12 }} /> {b.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Where it is kept, and the ask. */}
      <div style={{ marginTop: 11, paddingTop: 11, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {isSynced ? (
          <>
            <Cloud style={{ width: 13, height: 13, color: JADE, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>Saved to your account</span>
          </>
        ) : (
          <>
            <CloudOff style={{ width: 13, height: 13, color: TERTIARY, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>Saved in this browser.</span>
            {/* Its own control rather than a link inside the sentence: the
                phone rule in globals.css gives every button a 44px minimum, and
                a 44px box inline in an 11.5px line wrecks the line spacing.
                §3.1's pattern instead, at §2.13's control size. */}
            <button
              onClick={() => setAsk(true)}
              style={{ padding: 9, margin: -9, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 9,
                fontSize: 12.5, fontWeight: 700, fontFamily: MANROPE, whiteSpace: 'nowrap',
                background: '#fff', border: `1px solid ${BORDER}`, color: SECONDARY,
              }}>
                Create a free account to keep it
              </span>
            </button>
          </>
        )}
      </div>

      {ask && (
        <AccountDialog
          accent={JADE}
          what="your Learn progress"
          onClose={() => setAsk(false)}
          /* Nothing to finish here. Unlike a track, which the dialog has to
             carry out once there is somewhere to put it, progress is already
             saved: useLearnProgress pulls the cloud rows, merges this browser's
             in and pushes the difference up the moment a session exists. */
          onSignedIn={async () => {}}
        />
      )}
    </div>
  )
}
