/**
 * PageSkeleton — the placeholder a slow route shows while its data loads.
 *
 * Without a loading.tsx, the App Router leaves the PREVIOUS page on screen until
 * the next one is ready. On this site that is between one and two and a half
 * seconds of a page that looks like nothing happened, which is what had readers
 * clicking a second time.
 *
 * Deliberately vague. It suggests a heading and some blocks, and does not
 * pretend to be the specific layout that is coming — a skeleton that mimics the
 * real page too closely makes the swap feel like a flicker, and one that guesses
 * wrong is worse than one that never guessed.
 */

import { WOVEN_PAGE, BORDER } from '@/constants/theme'

export function PageSkeleton({ lines = 3, cards = 2 }: { lines?: number; cards?: number }) {
  return (
    <div style={WOVEN_PAGE}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px clamp(18px, 5vw, 36px) 80px' }}>
        <Bar w="34%" h={16} />
        <div style={{ height: 14 }} />
        <Bar w="62%" h={38} />
        <div style={{ height: 22 }} />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <Bar w={i === lines - 1 ? '48%' : '88%'} h={13} />
          </div>
        ))}
        <div style={{ height: 30 }} />
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))' }}>
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px', background: '#fff' }}>
              <Bar w="45%" h={14} />
              <div style={{ height: 14 }} />
              <Bar w="94%" h={11} />
              <div style={{ height: 8 }} />
              <Bar w="80%" h={11} />
            </div>
          ))}
        </div>
      </div>
      {/* One shared animation, defined once. Respects reduced motion — a pulsing
          block is exactly the kind of thing that setting exists for. */}
      <style>{`
        @keyframes ap-skel { 0%, 100% { opacity: .55 } 50% { opacity: .85 } }
        @media (prefers-reduced-motion: reduce) { .ap-skel { animation: none !important } }
      `}</style>
    </div>
  )
}

function Bar({ w, h }: { w: string; h: number }) {
  return (
    <div
      className="ap-skel"
      style={{
        width: w, height: h, borderRadius: 6,
        background: 'linear-gradient(90deg, #e9e7e2, #f2f0ec, #e9e7e2)',
        animation: 'ap-skel 1.4s ease-in-out infinite',
      }}
    />
  )
}
