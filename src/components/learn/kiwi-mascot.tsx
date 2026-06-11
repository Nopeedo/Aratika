'use client'

/**
 * Kiri the Kiwi — a friendly mascot for the Kids learning tier.
 * Pure SVG; gently bobs via Framer Motion.
 */

import { motion } from 'framer-motion'

export function KiwiMascot({ size = 72 }: { size?: number }) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 100 100"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      role="img" aria-label="Kiri the Kiwi"
      style={{ flexShrink: 0 }}
    >
      {/* legs */}
      <rect x="46" y="80" width="4" height="12" rx="2" fill="#c98a3c" />
      <rect x="58" y="80" width="4" height="12" rx="2" fill="#c98a3c" />
      <path d="M42 92 h10 M56 92 h10" stroke="#c98a3c" strokeWidth="4" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="56" cy="56" rx="32" ry="29" fill="#9c6b43" />
      {/* belly */}
      <ellipse cx="62" cy="62" rx="20" ry="20" fill="#c08e5e" />
      {/* wing */}
      <ellipse cx="64" cy="54" rx="10" ry="14" fill="#8a5d39" />
      {/* beak */}
      <path d="M26 54 L2 58 L26 62 Z" fill="#5a4632" />
      {/* eye */}
      <circle cx="40" cy="46" r="9" fill="#fff" />
      <circle cx="42" cy="47" r="4.5" fill="#1a1a1a" />
      <circle cx="43.5" cy="45.5" r="1.6" fill="#fff" />
      {/* cheek */}
      <circle cx="34" cy="60" r="4.5" fill="#e98aa0" opacity="0.75" />
      {/* little tuft */}
      <path d="M50 28 q3 -8 7 -4 q-1 5 -7 6 Z" fill="#8a5d39" />
    </motion.svg>
  )
}
