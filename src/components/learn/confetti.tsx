'use client'

/**
 * Confetti — a one-shot celebratory burst from the centre. Remount (via key) to
 * replay. Used for correct answers in the playful Kids tier.
 */

import { motion } from 'framer-motion'

const COLORS = ['#16A34A', '#D62700', '#00529F', '#FDB913', '#e0529c', '#7c3aed']

export function Confetti({ count = 20 }: { count?: number }) {
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, pointerEvents: 'none', zIndex: 5 }} aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2
        const dist = 55 + (i % 4) * 22
        const x = Math.cos(angle) * dist
        const y = Math.sin(angle) * dist
        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{ opacity: 0, x, y: y + 50, scale: 0.6, rotate: 220 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              position: 'absolute', width: 9, height: 9, borderRadius: 2,
              background: COLORS[i % COLORS.length],
            }}
          />
        )
      })}
    </div>
  )
}
