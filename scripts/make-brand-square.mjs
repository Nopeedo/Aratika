/**
 * make-brand-square.mjs — the wordmark as a square PNG, for social posts.
 *
 * Renders through the same Satori pipeline the OG cards use (next/og), with
 * the same Manrope file from src/assets/fonts, so the letterforms are the real
 * thing rather than whatever an SVG converter falls back to. The "Poli" ink /
 * "tika" jade split matches the navbar, the footer and the share cards — see
 * PolitikaLogo in navbar.tsx for why the split is where it is.
 *
 * A script rather than a route: the dev server's own OG routes were failing at
 * the time this was written ("failed to pipe response", the existing election
 * card too), and an image generated for a one-off post has no reason to be a
 * public URL.
 *
 * next/og is imported by path from Next's bundled copy and through
 * createRequire, because the package has no ESM entry point of its own.
 *
 *   node scripts/make-brand-square.mjs [outdir]   (default: ./brand)
 */

import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createElement as h } from 'react'

const require = createRequire(import.meta.url)
const { ImageResponse } = require('next/dist/compiled/@vercel/og/index.node.js')

const INK = '#2A1206'
const JADE = '#1F8A4C'
const SIZE = 1080

const outDir = process.argv[2] || 'brand'
mkdirSync(outDir, { recursive: true })
const font = readFileSync('src/assets/fonts/Manrope-ExtraBold.ttf')

async function square(file, { bg, ink, jade }) {
  const el = h(
    'div',
    { style: { width: SIZE, height: SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg } },
    h(
      'div',
      // letterSpacing is a NUMBER: Satori throws on a unit string, and the
      // failure surfaces only as a dead response with no message.
      { style: { display: 'flex', fontFamily: 'Manrope', fontSize: 245, fontWeight: 800, letterSpacing: -9 } },
      h('span', { style: { color: ink } }, 'Poli'),
      h('span', { style: { color: jade } }, 'tika'),
    ),
  )
  const res = new ImageResponse(el, {
    width: SIZE, height: SIZE,
    fonts: [{ name: 'Manrope', data: font, weight: 800, style: 'normal' }],
  })
  const path = join(outDir, file)
  writeFileSync(path, Buffer.from(await res.arrayBuffer()))
  console.log(`${path}  ${SIZE}x${SIZE}`)
}

await square('politika-square-white.png', { bg: '#ffffff', ink: INK, jade: JADE })
await square('politika-square-jade.png', { bg: JADE, ink: '#ffffff', jade: '#BFEBD2' })
