'use client'

/**
 * DonateForm — the /donate card, laid out after Onebyone Project's own
 * /donate page (onebyoneproject.co frontend/src/pages/PlatformDonate.tsx), by
 * request, cut down further by request: one-time only, and the donor types
 * their own amount (no preset amounts, nothing pre-selected, no monthly).
 * Currency pill, amount field, the optional fee cover, one Continue button to
 * Stripe. Politika's jade in place of Onebyone's teal.
 *
 * Onebyone processes the payment (it's the merchant, on Politika's behalf):
 * Continue posts to /api/donate/checkout, which opens a Stripe Checkout
 * session on Onebyone's account. Until that account's key is configured the
 * route isn't live, `open` is false, and the button says so instead of
 * pretending.
 */

import * as React from 'react'

// Weight-matched, not FX-converted: $10 is $10 in each, and the number shown
// is the number charged (Onebyone's rule, for the same reason).
const CURRENCIES = ['NZD', 'USD', 'AUD'] as const
type Currency = (typeof CURRENCIES)[number]

/** Stripe NZ standard pricing, 2.9% + 30c: drives the optional fee cover. */
function processingFee(dollars: number): number {
  if (dollars <= 0) return 0
  return Math.round((dollars * 0.029 + 0.3) * 100) / 100
}


export function DonateForm({ open }: { open: boolean }) {
  const [custom, setCustom] = React.useState('')
  const [currency, setCurrency] = React.useState<Currency>('NZD')
  // Off by default: no pre-ticked extras.
  const [coverFee, setCoverFee] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')

  const customNum = custom ? Math.max(0, Math.floor(Number(custom) || 0)) : 0
  const amount = customNum
  const fee = processingFee(amount)
  const total = coverFee ? amount + fee : amount
  const totalLabel = coverFee ? total.toFixed(2) : String(total)

  const cta = !open
    ? 'Donations open soon'
    : amount > 0
      ? `Continue with $${totalLabel} ${currency} donation →`
      : 'Continue →'

  async function go() {
    if (!open || amount <= 0) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/donate/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amountCents: Math.round(total * 100), currency: currency.toLowerCase(), coverFee }),
      })
      const json = (await res.json().catch(() => ({}))) as { url?: string }
      if (res.ok && json.url) {
        window.location.href = json.url
        return
      }
      setError('Could not open checkout. Please try again in a moment.')
    } catch {
      setError('Could not open checkout. Please try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dn-amount-row">
        <label htmlFor="dn-currency" className="dn-sr">Currency</label>
        <div className="dn-currency">
          <select id="dn-currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <svg aria-hidden viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <span className="dn-label">One-time donation</span>
      </div>

      <div className={'dn-custom' + (customNum > 0 ? ' on' : '')}>
        <span aria-hidden>$</span>
        <input id="dn-amount" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Enter an amount" aria-label="Donation amount in dollars"
          value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ''))} />
        <span className="dn-custom-cur" aria-hidden>{currency}</span>
      </div>

      {amount > 0 && (
        <label className="dn-amplify">
          <input type="checkbox" checked={coverFee} onChange={(e) => setCoverFee(e.target.checked)} />
          <span>
            <strong>Amplify your gift:</strong> help cover the <em>{currency} {fee.toFixed(2)}</em> estimated processing
            fee, so more of your donation goes to running Politika.
          </span>
        </label>
      )}

      {error && <div className="dn-error">{error}</div>}

      <button type="button" className="dn-cta" onClick={go} disabled={!open || submitting || amount <= 0}>
        {submitting ? 'Opening checkout…' : cta}
      </button>

      {!open && (
        <p className="dn-soon">
          We&rsquo;re setting up card payments now. Check back soon, or email{' '}
          <a href="mailto:hello@politika.nz">hello@politika.nz</a> if you&rsquo;d like to help sooner.
        </p>
      )}

      <p className="dn-terms">
        By tapping Continue, you agree to our <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.
        Payments are processed by Onebyone Project on Politika&rsquo;s behalf, so that&rsquo;s the name you&rsquo;ll
        see on your statement.
      </p>
    </>
  )
}

// Onebyone's .closed-* rules, renamed and re-coloured: teal #5EC4B8 becomes
// Politika's jade #1F8A4C, its tints become jade tints.
const CSS = `
.dn-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
.dn-amount-row { display:flex; justify-content:space-between; align-items:center; gap:8px; margin:0 0 10px; }
.dn-label { font:700 14px var(--font-manrope), system-ui, sans-serif; color:#2A1206; }
.dn-currency { position:relative; display:inline-flex; flex-shrink:0; }
.dn-currency select { appearance:none; -webkit-appearance:none; background:#F5F8F6; border:1px solid #D9E3DD; border-radius:999px;
  padding:5px 26px 5px 12px; font:600 12px/1.4 var(--font-manrope), system-ui, sans-serif; letter-spacing:.04em; color:#4A5560; cursor:pointer; outline:none; }
.dn-currency select:focus-visible { border-color:#1F8A4C; box-shadow:0 0 0 3px rgba(31,138,76,.18); }
.dn-currency svg { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#8A929B; pointer-events:none; }
.dn-custom { display:flex; align-items:center; gap:8px; background:#fff; border:2px solid #E6ECE8; border-radius:14px; padding:0 14px;
  height:56px; margin:0 0 18px; font:700 18px var(--font-manrope), system-ui, sans-serif; color:#2A1206; }
.dn-custom.on { border-color:#1F8A4C; }
.dn-custom input { flex:1; min-width:0; border:0; outline:none; background:transparent; font:inherit; color:inherit; }
.dn-custom input::placeholder { font-weight:500; color:#9a9186; }
.dn-custom-cur { font-size:12px; font-weight:600; color:#8A929B; }
.dn-amplify { display:flex; gap:10px; align-items:flex-start; margin:0 0 16px; font:400 13px/1.5 var(--font-manrope), system-ui, sans-serif; color:#6b6157; cursor:pointer; }
.dn-amplify input { margin-top:3px; accent-color:#1F8A4C; }
.dn-amplify strong { color:#2A1206; }
.dn-error { color:#b42318; font:600 13px var(--font-manrope), system-ui, sans-serif; margin:0 0 10px; }
.dn-cta { width:100%; border:0; border-radius:999px; background:#1F8A4C; color:#fff; padding:15px 20px; cursor:pointer;
  font:800 16px var(--font-manrope), system-ui, sans-serif; transition:background .15s, opacity .15s; }
.dn-cta:hover:not(:disabled) { background:#18703d; }
.dn-cta:disabled { opacity:.55; cursor:not-allowed; }
.dn-soon { margin:10px 0 0; text-align:center; font:400 13px/1.5 var(--font-manrope), system-ui, sans-serif; color:#6b6157; }
.dn-soon a, .dn-terms a { color:#1F8A4C; font-weight:700; text-decoration:none; }
.dn-terms { margin:14px 0 0; text-align:center; font:400 12px/1.5 var(--font-manrope), system-ui, sans-serif; color:#9a9186; }
`
