/**
 * smoke.mjs — post-deploy health + safety check against the LIVE site.
 *
 * Catches what a compile can't: a page that builds but 500s at runtime, a route
 * that vanished, or — the one that matters most — the editor auth gate silently
 * opening. Runs on a schedule (also a lightweight uptime check) and on demand.
 * Exits non-zero on any failure so the run goes red and GitHub emails.
 *
 * Run: BASE=https://arapono.org.nz node scripts/smoke.mjs
 */
const BASE = process.env.BASE || 'https://arapono.org.nz'
const UA = 'AraponoSmoke/1.0'
let failures = 0
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failures++ }

async function status(path, opts = {}) {
  try {
    const res = await fetch(BASE + path, { headers: { 'User-Agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(20000), ...opts })
    return res.status
  } catch (e) { console.log(`  (fetch error on ${path}: ${e.message})`); return 0 }
}

// Key public pages must render.
for (const p of ['/', '/parties', '/policies/economy', '/legislation', '/battlegrounds', '/battlegrounds/mt-albert', '/elections/2026', '/learn']) {
  ok((await status(p)) === 200, `GET ${p} → 200`)
}

// Retired URLs must keep redirecting rather than 404. Both were asserted at 200
// before, which failed the moment they became redirects — and a smoke test that
// cries wolf is one nobody reads when it finally catches something real. What
// matters for these is that an old link still lands somewhere, so a 3xx is the
// pass and a 404 or a 200 (meaning the redirect was dropped) is the failure.
for (const [from, why] of [['/compare', 'retired, now the policy hub'], ['/policies', 'now opens on the first topic']]) {
  const code = await status(from)
  ok(code >= 300 && code < 400, `GET ${from} → ${code} (expect 3xx — ${why})`)
}

// The editor WRITE api must reject an unauthenticated caller — this is the
// "UI-only security" guard: being anonymous must never let you approve content.
const editorPost = await status('/api/editor/review', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'x', action: 'approve' }) })
ok(editorPost === 401 || editorPost === 403, `POST /api/editor/review unauthenticated → ${editorPost} (expect 401/403, NOT 200)`)

// A bookmarks write must also reject anonymous callers.
const bmDelete = await status('/api/bookmarks?kind=bill&ref=x', { method: 'DELETE' })
ok(bmDelete === 401 || bmDelete === 403 || bmDelete === 400, `DELETE /api/bookmarks unauthenticated → ${bmDelete} (expect 4xx, NOT 200)`)

console.log(`\n${failures === 0 ? 'All smoke checks passed.' : failures + ' smoke check(s) FAILED.'}`)
process.exit(failures ? 1 : 0)
