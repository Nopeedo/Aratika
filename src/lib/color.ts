/**
 * Colour helpers shared by anything that prints a party's colour as text.
 *
 * readableOnWhite lived in coverage-matrix.tsx and was copied by hand into the
 * issue panels; the party profile needed it too, which made three. One copy,
 * one set of numbers.
 */

/** The party colour, darkened only as far as it must be to read as text on a
 *  light ground. Luminance over 0.5 is scaled down and the hue is untouched,
 *  so ACT stays recognisably ACT instead of going grey. */
export function readableOnWhite(hex: string): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum <= 0.5) return hex
  const k = 0.42 / lum
  const hx = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')
  return `#${hx(r)}${hx(g)}${hx(b)}`
}
