/**
 * template.mjs — the Politika donation receipt, as EMAIL-SAFE HTML.
 *
 * Same constraints and palette as the welcome email (scripts/welcome/
 * template.mjs): tables, inline styles, a hosted PNG. Returns
 * { subject, html, text }.
 *
 * What it has to say, plainly: thank you, how much, when, the reference, and
 * the one thing that would otherwise confuse someone, that the charge on their
 * statement says Onebyone Project, because Onebyone processes Politika's
 * donations. And that this is a payment receipt, not one for the donation tax
 * credit: Politika is not a registered charity.
 */

const JADE = '#1F8A4C', ESPRESSO = '#2A1206', WARM = '#5b3d2a'
const BODY = '#3f372f', SUB = '#6b6157', FAINT = '#9a9186'
const LINE = '#e9e4db', GROUND = '#f4f2ec'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const p = (t) => `<div style="font-family:Arial,sans-serif;font-size:14.5px;color:${BODY};line-height:1.6">${t}</div>`

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** "29 September 2026", in New Zealand time. */
function nzDate(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const [y, m, day] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(d).split('-').map(Number)
  return `${day} ${MONTHS[m - 1]} ${y}`
}

function row(label, value) {
  return `<tr>
    <td style="padding:9px 0;border-top:1px solid ${LINE};font-family:Arial,sans-serif;font-size:13.5px;color:${SUB}">${esc(label)}</td>
    <td align="right" style="padding:9px 0;border-top:1px solid ${LINE};font-family:Arial,sans-serif;font-size:13.5px;font-weight:800;color:${ESPRESSO}">${value}</td>
  </tr>`
}

export function renderReceipt({ name, amountCents, currency, reference, paidAt, siteUrl }) {
  const site = (siteUrl || 'https://politika.nz').replace(/\/$/, '')
  const logo = `${site}/icon-192.png`
  const cur = String(currency || 'nzd').toUpperCase()
  const amount = `$${(amountCents / 100).toFixed(2)} ${cur}`
  const date = nzDate(paidAt) || nzDate(new Date().toISOString())
  // First name only, and only if it looks like one (same rule as the welcome).
  const first = String(name || '').trim().split(/\s+/)[0]
  const greeting = first && first.length <= 24 && /^[\p{L}'’-]+$/u.test(first) ? `Kia ora ${esc(first)},` : 'Kia ora,'

  const subject = `Your donation to Politika: ${amount}`

  const html = `<!-- Politika donation receipt -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${GROUND};margin:0;padding:0">
  <tr><td align="center" style="padding:28px 12px 48px">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px">

      <tr><td align="center" style="padding:6px 20px 4px">
        <img src="${logo}" width="30" height="30" alt="Politika" style="border-radius:8px;display:inline-block;vertical-align:middle">
        <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${WARM};vertical-align:middle;margin-left:8px">Politika</span>
        <div style="font-family:Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:-.02em;color:${ESPRESSO};line-height:1.08;margin-top:14px">Thank you</div>
      </td></tr>

      <tr><td style="padding:16px 4px 18px">
        ${p(`${greeting} thank you for your donation. It helps keep Politika running, independent and free for everyone.`)}
      </td></tr>

      <tr><td style="padding:0 0 14px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border:1px solid ${LINE};border-radius:16px">
          <tr><td style="padding:20px 22px">
            <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${WARM};margin-bottom:10px">Receipt</div>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              ${row('Donation', esc(amount))}
              ${row('Date', esc(date))}
              ${row('Reference', esc(reference))}
              ${row('Paid to', 'Politika')}
            </table>
            <div style="font-family:Arial,sans-serif;font-size:12.5px;color:${SUB};line-height:1.55;margin-top:12px">
              Politika takes donations through <b style="color:${ESPRESSO}">Stripe</b>. Your card details were entered on Stripe&rsquo;s own page and never reached us.
            </div>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:4px 4px 0">
        ${p(`Questions about your donation? Just reply to this email.`)}
        <div style="font-family:Arial,sans-serif;font-size:12px;color:${FAINT};line-height:1.55;margin-top:14px">
          This is a receipt for your payment. Politika is not a registered charity, so it is not a receipt for the donation tax credit.
        </div>
        <div style="font-family:Arial,sans-serif;font-size:12px;color:${FAINT};margin-top:10px">
          <a href="${esc(site)}" style="color:${JADE};font-weight:800;text-decoration:none">politika.nz</a>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>`

  const text = [
    `${first && /^[\p{L}'’-]+$/u.test(first) ? `Kia ora ${first},` : 'Kia ora,'} thank you for your donation. It helps keep Politika running, independent and free for everyone.`,
    '',
    'RECEIPT',
    `Donation: ${amount}`,
    `Date: ${date}`,
    `Reference: ${reference}`,
    'Paid to: Politika',
    '',
    "Politika takes donations through Stripe. Your card details were entered on Stripe's own page and never reached us.",
    '',
    'Questions about your donation? Just reply to this email.',
    '',
    'This is a receipt for your payment. Politika is not a registered charity, so it is not a receipt for the donation tax credit.',
    site,
  ].join('\n')

  return { subject, html, text }
}
