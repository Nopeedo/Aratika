/**
 * template.mjs — renders the Arapono Weekly newsletter as EMAIL-SAFE HTML.
 *
 * Email clients (Outlook especially) strip <style>, background images, flexbox
 * and SVG — so this is table-based with inline styles and a hosted PNG logo. It
 * approximates the homepage look: warm palette, jade, a flip-clock-style
 * countdown (bordered cells), the party-tile colour row, white cards, dark
 * footer. Returns { subject, html, text }.
 */

const JADE = '#1F8A4C', ESPRESSO = '#2A1206', WARM = '#5b3d2a', INK = '#0c0e12', BODY = '#3f372f', SUB = '#6b6157', FAINT = '#9a9186'
const LINE = '#e9e4db', CREAM = '#f4f1ec', GROUND = '#f4f2ec'
const PARTY_TILES = ['#0A5BA8', '#D5202B', '#1F8A4C', '#F5C518', '#181a1f', '#B11226']

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function digitCell(d) {
  return `<td style="padding:0 3px"><table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #e6e2da;border-radius:8px;background:#ffffff"><tr><td style="width:50px;height:64px;text-align:center;font-family:Arial,sans-serif;font-size:44px;font-weight:800;color:${ESPRESSO};border-bottom:1px solid ${CREAM}">${esc(d)}</td></tr></table></td>`
}

function storyRow(s) {
  return `<tr><td style="padding:11px 0;border-top:1px solid ${LINE}">
    <div style="font-family:Arial,sans-serif;font-size:15px;font-weight:800;color:${INK};line-height:1.35">${esc(s.title)}</div>
    ${s.blurb ? `<div style="font-family:Arial,sans-serif;font-size:13.5px;color:${SUB};line-height:1.5;margin-top:3px">${esc(s.blurb)} ${s.url ? `<a href="${esc(s.url)}" style="color:${JADE};font-weight:700;text-decoration:none">Read →</a>` : ''}</div>` : ''}
    ${s.source ? `<div style="font-family:Arial,sans-serif;font-size:11.5px;color:${FAINT};font-weight:700;margin-top:5px">${esc(s.source)}</div>` : ''}
  </td></tr>`
}

function trackedRow(t) {
  return `<tr><td style="padding:11px 0;border-top:1px solid ${LINE}">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
      <td width="14" valign="top" style="padding-top:5px"><div style="width:9px;height:9px;border-radius:50%;background:${t.dot || FAINT}"></div></td>
      <td style="font-family:Arial,sans-serif">
        <div style="font-size:14.5px;font-weight:800;color:${INK};line-height:1.35">${esc(t.title)}${t.chip ? ` <span style="font-size:10.5px;font-weight:800;color:${JADE};background:#eef7f0;padding:2px 8px;border-radius:10px">${esc(t.chip)}</span>` : ''}</div>
        ${t.meta ? `<div style="font-size:13px;color:${SUB};line-height:1.5;margin-top:3px">${t.meta}</div>` : ''}
      </td>
    </tr></table>
  </td></tr>`
}

function card(inner) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid ${LINE};border-radius:16px;margin:0 0 16px">
    <tr><td style="padding:20px 22px">${inner}</td></tr></table>`
}
const eyebrow = (t) => `<div style="font-family:Arial,sans-serif;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${JADE};margin:0 0 4px">${esc(t)}</div>`
const h2 = (t) => `<div style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:${INK};margin:0 0 12px">${esc(t)}</div>`

export function renderNewsletter({ name, daysToElection, tracked, general, siteUrl, unsubscribeUrl, manageUrl }) {
  const site = (siteUrl || 'https://arapono.org.nz').replace(/\/$/, '')
  const logo = `${site}/icon-192.png`
  const days = String(daysToElection).padStart(3, '0').split('')

  const trackedCard = tracked?.items?.length
    ? card(`${eyebrow('On what you follow')}${h2('Things you track moved')}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${tracked.items.map(trackedRow).join('')}</table>
        <a href="${esc(manageUrl || site + '/dashboard')}" style="display:inline-block;margin-top:12px;font-family:Arial,sans-serif;font-size:13.5px;font-weight:800;color:${JADE};text-decoration:none">See everything in your command centre →</a>`)
    : card(`${eyebrow('On what you follow')}${h2('Follow what matters to you')}
        <div style="font-family:Arial,sans-serif;font-size:14px;color:${SUB};line-height:1.55">You’re not following anything yet. Track a party, MP or bill and we’ll surface just those updates here.</div>
        <a href="${esc(site + '/dashboard')}" style="display:inline-block;margin-top:12px;font-family:Arial,sans-serif;font-size:13.5px;font-weight:800;color:${JADE};text-decoration:none">Start tracking →</a>`)

  const g = general || {}
  const generalCard = card(`${eyebrow('Across the motu this week')}${h2('The week in brief')}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${(g.stories || []).map(storyRow).join('')}</table>
    ${g.video ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${LINE};border-radius:12px;margin-top:12px"><tr><td style="padding:11px 13px;font-family:Arial,sans-serif"><div style="font-size:13.5px;font-weight:800;color:${INK}">▶ ${esc(g.video.title)}</div><div style="font-size:12px;color:${FAINT};margin-top:2px">${esc(g.video.meta || '')}</div></td></tr></table>` : ''}
    ${g.stats ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px"><tr>
      <td width="33%" style="padding:0 4px"><table role="presentation" width="100%" style="border:1px solid ${LINE};border-radius:12px"><tr><td style="padding:12px 4px;text-align:center;font-family:Arial,sans-serif"><div style="font-size:24px;font-weight:800;color:${JADE}">${g.stats.passed ?? 0}</div><div style="font-size:11px;color:${SUB}">passed into law</div></td></tr></table></td>
      <td width="33%" style="padding:0 4px"><table role="presentation" width="100%" style="border:1px solid ${LINE};border-radius:12px"><tr><td style="padding:12px 4px;text-align:center;font-family:Arial,sans-serif"><div style="font-size:24px;font-weight:800;color:${JADE}">${g.stats.newBills ?? 0}</div><div style="font-size:11px;color:${SUB}">new bills</div></td></tr></table></td>
      <td width="33%" style="padding:0 4px"><table role="presentation" width="100%" style="border:1px solid ${LINE};border-radius:12px"><tr><td style="padding:12px 4px;text-align:center;font-family:Arial,sans-serif"><div style="font-size:24px;font-weight:800;color:${JADE}">${g.stats.submissions ?? 0}</div><div style="font-size:11px;color:${SUB}">open for submissions</div></td></tr></table></td>
    </tr></table>` : ''}`)

  const tiles = PARTY_TILES.map((c) => `<td style="padding:0 3px"><a href="${site}/parties" style="display:block;width:44px;height:44px;border-radius:9px;background:${c}">&nbsp;</a></td>`).join('')

  const html = `<!-- Arapono Weekly -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${GROUND};margin:0;padding:0">
  <tr><td align="center" style="padding:28px 12px 48px">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px">

      <!-- masthead -->
      <tr><td align="center" style="padding:6px 20px 4px">
        <img src="${logo}" width="30" height="30" alt="Arapono" style="border-radius:8px;display:inline-block;vertical-align:middle">
        <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${WARM};vertical-align:middle;margin-left:8px">Arapono Weekly</span>
        <div style="font-family:Arial,sans-serif;font-size:34px;font-weight:800;letter-spacing:-.02em;color:${ESPRESSO};line-height:1.05;margin-top:14px">Your week, before <span style="color:${JADE}">the vote</span></div>
      </td></tr>

      <!-- countdown -->
      <tr><td align="center" style="padding:18px 0 2px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digitCell(days[0])}${digitCell(days[1])}${digitCell(days[2])}</tr></table>
        <div style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:.04em;color:${WARM};margin-top:9px">Days until 2026 elections</div>
      </td></tr>

      <!-- party tiles -->
      <tr><td align="center" style="padding:20px 0 4px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>${tiles}</tr></table>
      </td></tr>
      <tr><td align="center" style="padding:0 24px 18px;font-family:Arial,sans-serif;font-size:13px;color:${SUB}">${name ? `Kia ora ${esc(name)} — ` : ''}here’s your week. Yours first, then the motu.</td></tr>

      <!-- cards -->
      <tr><td style="padding:0 20px">${trackedCard}${generalCard}

        <!-- enrolment CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fbf3e6;border:1px solid #ecdcc4;border-radius:16px;margin:0 0 16px">
          <tr><td align="center" style="padding:20px">
            <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:800;color:${ESPRESSO}">${daysToElection} days to go — are you enrolled?</div>
            <div style="font-family:Arial,sans-serif;font-size:14px;color:${WARM};margin:4px 0 14px">Two minutes, and it’s the one thing that has to happen first.</div>
            <a href="${site}/guide" style="display:inline-block;background:${JADE};color:#ffffff;font-family:Arial,sans-serif;font-size:14.5px;font-weight:800;padding:12px 22px;border-radius:12px;text-decoration:none">Check or enrol</a>
          </td></tr>
        </table>

        <!-- footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0c0e12;border-radius:16px">
          <tr><td style="padding:22px 24px;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:rgba(255,255,255,.6)">
            <img src="${logo}" width="24" height="24" alt="" style="border-radius:6px;vertical-align:middle"><span style="color:#fff;font-weight:800;font-size:14px;margin-left:7px;vertical-align:middle">Arapono</span>
            <div style="margin-top:12px;color:rgba(255,255,255,.82)">Sourced from NZ Parliament · Electoral Commission · Stats NZ · RNZ · Treasury</div>
            <div style="margin-top:12px">You’re getting this because you have an Arapono account. <a href="${esc(manageUrl || site + '/dashboard')}" style="color:#7fe3aa;text-decoration:none">Manage what you follow</a> · <a href="${esc(unsubscribeUrl)}" style="color:#7fe3aa;text-decoration:none">Unsubscribe</a>.</div>
            <div style="margin-top:12px;color:rgba(255,255,255,.4)">Arapono is an independent, non-partisan platform. We point to the record and let you decide — we never tell you how to vote.</div>
          </td></tr>
        </table>

      </td></tr>
    </table>
  </td></tr>
</table>`

  const textLines = [
    `ARAPONO WEEKLY — ${daysToElection} days until the 2026 election`,
    name ? `Kia ora ${name},` : 'Kia ora,',
    '',
    'ON WHAT YOU FOLLOW',
    ...(tracked?.items?.length ? tracked.items.map((t) => `• ${t.title}${t.chip ? ` (${t.chip})` : ''}`) : ['• Nothing tracked yet — start at ' + site + '/dashboard']),
    '',
    'ACROSS THE MOTU THIS WEEK',
    ...((general?.stories || []).map((s) => `• ${s.title}${s.url ? ` — ${s.url}` : ''}`)),
    '',
    `${daysToElection} days to go — check you're enrolled: ${site}/guide`,
    '',
    `Manage: ${manageUrl || site + '/dashboard'}  ·  Unsubscribe: ${unsubscribeUrl}`,
    'Arapono is independent and non-partisan.',
  ]

  const subject = tracked?.items?.length
    ? `Your week in NZ politics — ${tracked.items.length} update${tracked.items.length > 1 ? 's' : ''} on what you follow`
    : `Your week in NZ politics — ${daysToElection} days to the election`

  return { subject, html, text: textLines.join('\n') }
}
