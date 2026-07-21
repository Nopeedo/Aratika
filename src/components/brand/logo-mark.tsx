/**
 * LogoMark — the Arapono brand mark: three ascending chevrons, an "ara" (path/way)
 * rising forward. Jade by default (on light surfaces); pass `reversed` for the white
 * treatment used on the jade app tile and dark footer. Presentational only.
 *
 * The favicon is the same mark, reversed on a jade tile — see src/app/icon.svg.
 */

export function LogoMark({
  size = 24,
  reversed = false,
  className,
}: {
  size?: number
  reversed?: boolean
  className?: string
}) {
  const stroke = reversed ? '#ffffff' : '#1F8A4C'
  return (
    <svg
      width={size}
      height={Math.round(size * (26 / 28))}
      viewBox="0 0 28 26"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g stroke={stroke} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8 L14 2 L23 8" />
        <path d="M5 15 L14 9 L23 15" opacity={0.62} />
        <path d="M5 22 L14 16 L23 22" opacity={0.38} />
      </g>
    </svg>
  )
}
