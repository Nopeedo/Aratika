/**
 * StartHereCta — a small, quiet title that sits directly under the hero subline
 * and introduces the party tiles below. Deliberately minimal (a title + one
 * line, no card) so it orients a first-timer without competing with the hero or
 * the tiles for attention.
 */

const MANROPE = 'var(--font-manrope), system-ui, sans-serif'
const INK = '#2A1206', SUB = '#5b3d2a'

export function StartHereCta() {
  return (
    <section style={{ background: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 clamp(18px, 5vw, 36px) clamp(18px, 3vh, 26px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(21px,3.4vw,25px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: '0 0 4px' }}>
          Start here
        </h2>
        <p style={{ fontSize: 'clamp(15px,1.8vw,17px)', fontWeight: 500, color: SUB, fontFamily: MANROPE, lineHeight: 1.5, margin: 0 }}>
          Use the tiles below to compare the parties.
        </p>
      </div>
    </section>
  )
}
