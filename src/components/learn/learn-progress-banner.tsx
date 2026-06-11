'use client'

/**
 * LearnProgressBanner — shows the learner's XP, level, mastery badges and sync
 * status on the /learn hub. Client-side (reads localStorage / Supabase progress).
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Zap, Award, Cloud, CloudOff } from 'lucide-react'
import { useLearnProgress } from '@/hooks/use-learn-progress'
import { computeStats } from '@/lib/learn/xp'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C', AMBER = '#c9a227'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function LearnProgressBanner() {
  const { progress, loaded, isSynced } = useLearnProgress()
  if (!loaded) return null

  const stats = computeStats(progress)
  const started = stats.tiersCompleted > 0
  const pct = (stats.xpIntoLevel / stats.xpForLevel) * 100

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, background: SURFACE, padding: '18px 20px', marginBottom: 24 }}>
      {!started ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap style={{ width: 20, height: 20, color: AMBER }} />
          </div>
          <div style={{ fontFamily: MANROPE }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>Start learning to earn XP and badges</div>
            <div style={{ fontSize: 13, color: SECONDARY }}>Complete a module’s quiz at any level to begin. Master all four levels to earn its badge.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Level + XP */}
          <div style={{ minWidth: 200, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: JADE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: MANROPE }}>{stats.level}</span>
              </div>
              <div style={{ fontFamily: MANROPE }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>Level {stats.level}</div>
                <div style={{ fontSize: 11.5, color: TERTIARY }}>{stats.xp} XP total</div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: '#eceae5', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                style={{ height: '100%', background: JADE, borderRadius: 5 }} />
            </div>
            <div style={{ fontSize: 10.5, color: TERTIARY, fontFamily: MANROPE, marginTop: 4 }}>{stats.xpForLevel - stats.xpIntoLevel} XP to level {stats.level + 1}</div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 18 }}>
            <Stat icon={<Trophy style={{ width: 16, height: 16, color: AMBER }} />} value={`${stats.tiersCompleted}/${stats.tiersTotal}`} label="Levels done" />
            <Stat icon={<Award style={{ width: 16, height: 16, color: JADE }} />} value={`${stats.modulesMastered}`} label="Badges" />
          </div>

          {/* Badges */}
          {stats.badges.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 360 }}>
              {stats.badges.map((b) => (
                <span key={b.moduleId} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 999, padding: '4px 10px', fontFamily: MANROPE }}>
                  <Award style={{ width: 12, height: 12 }} /> {b.title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sync status */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        {isSynced ? (
          <><Cloud style={{ width: 13, height: 13, color: JADE }} /><span style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>Synced to your account</span></>
        ) : (
          <><CloudOff style={{ width: 13, height: 13, color: TERTIARY }} /><span style={{ fontSize: 11.5, color: SECONDARY, fontFamily: MANROPE }}>
            Progress saved on this device. <Link href="/login" style={{ color: JADE, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link> to save it across devices.
          </span></>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{ textAlign: 'center', fontFamily: MANROPE }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        {icon}<span style={{ fontSize: 18, fontWeight: 800, color: INK }}>{value}</span>
      </div>
      <div style={{ fontSize: 10.5, color: TERTIARY, marginTop: 1 }}>{label}</div>
    </div>
  )
}
