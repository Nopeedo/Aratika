/**
 * template.mjs — the Politika welcome email, as EMAIL-SAFE HTML.
 *
 * Same constraints as the weekly newsletter next door: Outlook strips <style>,
 * background images, flexbox and SVG, so this is tables, inline styles and a
 * hosted PNG. Returns { subject, html, text }.
 *
 * WHAT THIS EMAIL IS FOR
 *
 * Someone has just confirmed an account. They do not need a tour of eleven
 * features — they need one useful fact and one obvious next step, or the email
 * gets skimmed and the account goes cold.
 *
 * So the enrolment deadline leads. It is the only thing on this site where
 * being told late costs someone their vote, and 2026 is NOT 2023: enrolment
 * closes 25 October, thirteen days before election day, and there is no
 * enrolling once advance voting opens. Anyone reasoning from the last election
 * will get it wrong. If this email achieves one thing, it should be that.
 *
 * Then three first steps, not ten. Then the honest note that the weekly email
 * is already on, because the privacy policy says we tell people that and
 * burying it would make both statements worthless.
 *
 * Tone follows the site: plain, non-partisan, no urgency theatre. We point at
 * the record and let people decide.
 */

const JADE = '#1F8A4C', ESPRESSO = '#2A1206', WARM = '#5b3d2a', INK = '#0c0e12'
const BODY = '#3f372f', SUB = '#6b6157', FAINT = '#9a9186'
const LINE = '#e9e4db', GROUND = '#f4f2ec'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** "25 October" — the Electoral Commission's own prose form, so a date read here
 *  matches the one on their site rather than looking like a different deadline. */
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
function longDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : `${d.getUTCDate()} ${LONG_MONTHS[d.getUTCMonth()]}`
}

function card(inner) {
  return `<tr><td style="padding:0 0 14px">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border:1px solid ${LINE};border-radius:16px">
      <tr><td style="padding:20px 22px">${inner}</td></tr>
    </table></td></tr>`
}

const eyebrow = (t) => `<div style="font-family:Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${WARM};margin-bottom:7px">${esc(t)}</div>`
const h2 = (t) => `<div style="font-family:Arial,sans-serif;font-size:19px;font-weight:800;letter-spacing:-.01em;color:${ESPRESSO};line-height:1.25;margin-bottom:9px">${t}</div>`
const p = (t) => `<div style="font-family:Arial,sans-serif;font-size:14.5px;color:${BODY};line-height:1.6">${t}</div>`

/** One numbered first step. Number in a jade disc so it reads as a sequence
 *  even in clients that drop list styling. */
function step(n, title, blurb, href, cta) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px"><tr>
    <td width="34" valign="top" style="padding-top:2px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td width="26" height="26" align="center" valign="middle" style="width:26px;height:26px;background:${JADE};border-radius:13px;font-family:Arial,sans-serif;font-size:13px;font-weight:800;color:#fff;line-height:26px">${n}</td>
      </tr></table>
    </td>
    <td valign="top" style="font-family:Arial,sans-serif">
      <div style="font-size:14.5px;font-weight:800;color:${INK};line-height:1.35">${esc(title)}</div>
      <div style="font-size:13.5px;color:${SUB};line-height:1.55;margin-top:2px">${esc(blurb)}</div>
      <a href="${esc(href)}" style="display:inline-block;margin-top:5px;font-size:13.5px;font-weight:800;color:${JADE};text-decoration:none">${esc(cta)} &rarr;</a>
    </td>
  </tr></table>`
}

export function renderWelcome({ name, siteUrl, unsubscribeUrl, manageUrl, enrolmentCloses, electionDay, daysToEnrolment }) {
  const site = (siteUrl || 'https://politika.nz').replace(/\/$/, '')
  const logo = `${site}/icon-192.png`
  const manage = manageUrl || `${site}/settings`
  // First name only, and only if it looks like one. A greeting is warmer than
  // "Hi there" but "Hi tawhiao.watene+test" is worse than both.
  const first = String(name || '').trim().split(/\s+/)[0]
  const greeting = first && first.length <= 24 && /^[\p{L}'’-]+$/u.test(first) ? `Kia ora ${esc(first)},` : 'Kia ora,'

  const enrolBy = longDate(enrolmentCloses)
  const electionOn = longDate(electionDay)
  // Only state the countdown when it is still true. A welcome email that sits
  // in a queue and goes out after the deadline saying "28 days left" is worse
  // than one that just states the date.
  const countdown = Number.isFinite(daysToEnrolment) && daysToEnrolment > 0
    ? `That is <b style="color:${ESPRESSO}">${daysToEnrolment} day${daysToEnrolment === 1 ? '' : 's'}</b> away. `
    : ''

  const html = `<!-- Politika welcome -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${GROUND};margin:0;padding:0">
  <tr><td align="center" style="padding:28px 12px 48px">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px">

      <!-- masthead -->
      <tr><td align="center" style="padding:6px 20px 4px">
        <img src="${logo}" width="30" height="30" alt="Politika" style="border-radius:8px;display:inline-block;vertical-align:middle">
        <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${WARM};vertical-align:middle;margin-left:8px">Politika</span>
        <div style="font-family:Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:-.02em;color:${ESPRESSO};line-height:1.08;margin-top:14px">Welcome to <span style="color:${JADE}">Politika</span></div>
      </td></tr>

      <tr><td style="padding:16px 4px 18px">
        ${p(`${greeting} thanks for signing up.`)}
        <div style="height:9px"></div>
        ${p(`Politika is an independent, non-partisan place to work out where the parties actually stand before you vote. We point at the record and let you decide &mdash; we never tell you who to vote for.`)}
      </td></tr>

      <!-- The one thing that has a deadline attached. -->
      ${card(`${eyebrow('First, the date that matters')}${h2(`Enrolment closes ${esc(enrolBy)}`)}
        ${p(`${countdown}<b>2026 is not like 2023</b> &mdash; you cannot enrol or update your details once advance voting opens. If you have moved house, changed your name, or have never enrolled, it is worth two minutes now.`)}
        <a href="https://vote.nz/enrolling/get-enrolled/enrol-or-update/" style="display:inline-block;margin-top:13px;padding:11px 18px;background:${JADE};border-radius:9px;font-family:Arial,sans-serif;font-size:14px;font-weight:800;color:#fff;text-decoration:none">Check or update your enrolment &rarr;</a>
        <div style="font-family:Arial,sans-serif;font-size:12px;color:${FAINT};margin-top:9px">This link goes to vote.nz, the Electoral Commission&rsquo;s own site. Enrolment happens there, not here.</div>`)}

      ${card(`${eyebrow('Then, three things worth doing')}${h2('Where to start')}
        ${step(1, 'Find where you stand', 'Twelve questions, about three minutes. Shows which parties line up with you on the issues you picked — no score, no winner declared.', `${site}/start`, 'Take the compass')}
        ${step(2, 'Find your electorate and your MP', 'Type your address. See which seat you are in, who currently holds it, and how it was won last time.', `${site}/map`, 'Look up your address')}
        ${step(3, 'Follow what you care about', 'Track a party, an MP, a policy topic or a bill, and updates on those turn up in your command centre instead of you going looking.', `${site}/dashboard`, 'Open your command centre')}`)}

      ${card(`${eyebrow('So you know')}${h2('About the weekly email')}
        ${p(`You are signed up to the <b>Politika Weekly</b> &mdash; a short round-up each week, plus anything that moves on what you follow. It is on by default, and we would rather tell you that than have you find out on Sunday.`)}
        <div style="height:10px"></div>
        ${p(`<a href="${esc(manage)}" style="color:${JADE};font-weight:800;text-decoration:none">Turn it off in Settings</a> any time, or use the unsubscribe link at the bottom of any email. One switch covers everything we send.`)}`)}

      <tr><td style="padding:4px 4px 0">
        ${p(`Election day is <b style="color:${ESPRESSO}">${esc(electionOn)}</b>. We will be here for all of it.`)}
      </td></tr>

      <!-- footer -->
      <tr><td style="padding:26px 0 0">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${INK};border-radius:16px">
          <tr><td style="padding:20px 22px;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,.62);line-height:1.6">
            <img src="${logo}" width="24" height="24" alt="" style="border-radius:6px;vertical-align:middle"><span style="color:#fff;font-weight:800;font-size:14px;margin-left:7px;vertical-align:middle">Politika</span>
            <div style="margin-top:12px">You are getting this because you created a Politika account. <a href="${esc(manage)}" style="color:#7fe3aa;text-decoration:none">Manage emails</a> &middot; <a href="${esc(unsubscribeUrl)}" style="color:#7fe3aa;text-decoration:none">Unsubscribe</a>.</div>
            <div style="margin-top:12px;color:rgba(255,255,255,.4)">Politika is an independent, non-partisan platform. We point to the record and let you decide &mdash; we never tell you how to vote.</div>
          </td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>`

  // Plain-text alternative. Not decoration: a text part materially improves
  // deliverability, and some clients show it instead of the HTML.
  const text = [
    `${greeting.replace(/<[^>]*>/g, '')} thanks for signing up.`,
    '',
    'Politika is an independent, non-partisan place to work out where the parties actually stand before you vote. We point at the record and let you decide — we never tell you who to vote for.',
    '',
    `FIRST, THE DATE THAT MATTERS — enrolment closes ${enrolBy}.`,
    '2026 is not like 2023: you cannot enrol or update your details once advance voting opens.',
    'Check or update your enrolment: https://vote.nz/enrolling/get-enrolled/enrol-or-update/',
    '',
    'THREE THINGS WORTH DOING',
    `1. Find where you stand — ${site}/start`,
    `2. Find your electorate and your MP — ${site}/map`,
    `3. Follow what you care about — ${site}/dashboard`,
    '',
    `ABOUT THE WEEKLY EMAIL: you are signed up to the Politika Weekly. It is on by default. Turn it off at ${manage}, or unsubscribe: ${unsubscribeUrl}`,
    '',
    `Election day is ${electionOn}.`,
    'Politika is independent and non-partisan.',
  ].join('\n')

  return {
    // No exclamation mark, no "🎉". The subject names the useful thing, which
    // is also what makes it worth opening.
    subject: `Welcome to Politika — and the one date to put in your phone`,
    html,
    text,
  }
}
