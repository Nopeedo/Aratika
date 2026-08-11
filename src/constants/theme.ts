/**
 * theme.ts — the single source of truth for Arapono's inline-style palette.
 *
 * Why this exists: globals.css already defines CSS variables for the brand, but
 * ~120 pages and components each declared their own `const INK = '#0c0e12'` at
 * the top of the file. Nothing shared a source, so the site drifted into three
 * ink palettes and four background systems at once, and every retheme meant
 * editing every file again.
 *
 * The values here are the warm woven theme — the direction set by the homepage,
 * the Election Centre and the party pages. Importing these instead of
 * redeclaring them is what keeps the rest of the site from drifting back.
 *
 * Tailwind classes should keep using the CSS variables in globals.css; these
 * constants are for the inline `style={{ … }}` objects this codebase favours.
 */

// ─── Text ─────────────────────────────────────────────────────────────────────
/** Headings and primary copy — warm espresso, not black. */
export const INK = '#2A1206'
/** Body copy, labels, anything supporting the primary text. */
export const SECONDARY = '#6b6157'
/** Captions, metadata, timestamps — the quietest readable step. */
export const TERTIARY = '#9a9186'

// ─── Surfaces ─────────────────────────────────────────────────────────────────
/** Hairlines and card edges. */
export const BORDER = '#e6e2da'
/** Raised panels sitting on the page ground. */
export const SURFACE = '#faf8f4'
/** The woven page ground. Pair with WEAVE_IMAGE below. */
export const PAPER = '#f4f2ec'

// ─── Brand ────────────────────────────────────────────────────────────────────
export const JADE = '#1F8A4C'
export const JADE_DARK = '#176B3B'
export const JADE_SUBTLE = '#e8f5ee'

// ─── Type ─────────────────────────────────────────────────────────────────────
export const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
export const DISPLAY = 'var(--font-space-grotesk), system-ui, sans-serif'

// ─── Page ground ──────────────────────────────────────────────────────────────
/** Spread onto a page wrapper for the woven texture the theme is built on.
 *  One object so the tiling can never drift between pages — mismatched
 *  background-size is what produced a visible seam under the homepage hero. */
export const WOVEN_PAGE = {
  backgroundColor: PAPER,
  backgroundImage: 'url(/back2.jpg)',
  backgroundRepeat: 'repeat-y',
  backgroundSize: '100% auto',
  backgroundPosition: 'top center',
  minHeight: '100vh',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Any hex at an alpha — for tints that stay readable behind text. Accepts the
 *  3-digit form because party colours are authored both ways. */
export function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** Card shadow — warm-tinted, because a neutral grey shadow reads as grubby
 *  against the woven ground. */
export const CARD_SHADOW = '0 1px 2px rgba(42,18,6,.04), 0 8px 20px -12px rgba(42,18,6,.14)'
