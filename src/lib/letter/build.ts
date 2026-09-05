/**
 * Letter assembly + export helpers for the Take Action studio.
 * Pure functions — runs client-side; nothing is stored or sent automatically.
 */

import type { LetterTemplate, LetterInput, LetterContext } from '@/constants/letter-templates'

function stripMacrons(s: string): string {
  return s
    .replace(/[āàáâ]/g, 'a').replace(/[ēèéê]/g, 'e').replace(/[īìíî]/g, 'i')
    .replace(/[ōòóô]/g, 'o').replace(/[ūùúû]/g, 'u')
    .replace(/[ĀÀÁÂ]/g, 'A').replace(/[ĒÈÉÊ]/g, 'E').replace(/[ĪÌÍÎ]/g, 'I')
    .replace(/[ŌÒÓÔ]/g, 'O').replace(/[ŪÙÚÛ]/g, 'U')
}

/**
 * The standard New Zealand parliamentary email format. This is the documented
 * convention — always shown to the user as a suggestion to verify on the MP's
 * official page, never asserted as confirmed.
 */
export function deriveParliamentaryEmail(fullName: string): string {
  const parts = stripMacrons(fullName).toLowerCase().replace(/[^a-z\s-]/g, '').trim().split(/\s+/)
  if (parts.length < 2) return ''
  const first = parts[0]
  const last = parts[parts.length - 1]
  return `${first}.${last}@parliament.govt.nz`
}

function nzDate(): string {
  try {
    return new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

const STANCE_TEXT: Record<string, string> = {
  support: 'support this bill',
  oppose: 'oppose this bill',
  neither: 'neither support nor oppose this bill',
}

/** Assemble the full, formatted letter text from the template + the user's input. */
export function assembleLetter(template: LetterTemplate, input: LetterInput, ctx: LetterContext): string {
  const lines: string[] = []
  const date = nzDate()
  if (date) lines.push(date, '')

  // Recipient block
  if (ctx.recipientName) {
    lines.push(ctx.recipientName)
    if (ctx.recipientRole) lines.push(ctx.recipientRole)
    lines.push('')
  }

  // Salutation
  let salutation: string
  switch (template.recipientKind) {
    case 'committee':
      salutation = `To the ${ctx.committee || 'Select'} Committee,`
      break
    case 'agency':
      salutation = ctx.recipientName ? `Dear ${ctx.recipientName},` : 'To whom it may concern,'
      break
    case 'minister':
      salutation = ctx.recipientName ? `Dear ${ctx.recipientName},` : 'Dear Minister,'
      break
    default:
      salutation = ctx.recipientName ? `Dear ${ctx.recipientName},` : 'Dear Member,'
  }
  lines.push(salutation, '')

  // Subject
  if (input.subject.trim()) lines.push(`Re: ${input.subject.trim()}`, '')

  // Submission stance
  if (template.id === 'submission' && input.stance) {
    lines.push(`Position: I ${STANCE_TEXT[input.stance]}.`, '')
  }

  // Body (the citizen's own words)
  lines.push(input.body.trim() || '[Write your message here.]', '')

  // Submission — appearance preference
  if (template.id === 'submission') {
    lines.push(
      input.appear
        ? 'I would like to appear before the committee to speak to this submission.'
        : 'I do not wish to appear before the committee.',
      '',
    )
  }

  // Closing
  const closing = template.id === 'oia' ? 'Yours faithfully,' : 'Yours sincerely,'
  lines.push(closing)
  lines.push(input.senderName.trim() || '[Your name]')
  if (input.senderLocation.trim()) lines.push(input.senderLocation.trim())
  if (input.senderEmail.trim()) lines.push(input.senderEmail.trim())

  return lines.join('\n')
}

/** Build a mailto: link (recipient may be empty — user fills it in their client). */
export function mailtoHref(to: string, subject: string, body: string): string {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const qs = params.toString().replace(/\+/g, '%20')
  return `mailto:${to || ''}${qs ? `?${qs}` : ''}`
}

/**
 * Where "open in email" can actually send someone.
 *
 * mailto: alone was the whole answer, and it is the one that fails silently:
 * it needs a mail client registered with the operating system. Anyone reading
 * their mail at mail.google.com in a browser — which is most people — clicks it
 * and nothing happens at all. No error, no new window, nothing to retry.
 *
 * The two webmail services people actually use both take a compose URL, so they
 * work in a browser with no local client at all. mailto stays for anyone who
 * does have Mail or Outlook installed, but it is no longer the only door.
 */
export interface ComposeTarget { id: 'gmail' | 'outlook' | 'mailto'; label: string; href: string }

export function composeTargets(to: string, subject: string, body: string): ComposeTarget[] {
  const e = encodeURIComponent
  return [
    {
      id: 'gmail',
      label: 'Gmail',
      href: `https://mail.google.com/mail/?view=cm&fs=1&to=${e(to)}&su=${e(subject)}&body=${e(body)}`,
    },
    {
      id: 'outlook',
      label: 'Outlook',
      href: `https://outlook.live.com/mail/0/deeplink/compose?to=${e(to)}&subject=${e(subject)}&body=${e(body)}`,
    },
    { id: 'mailto', label: 'Mail app', href: mailtoHref(to, subject, body) },
  ]
}

/**
 * Very long letters go in the clipboard instead of the URL.
 *
 * Browsers and webmail providers both cap URL length, and they cap it by
 * truncating rather than refusing — so a long letter arrives in the compose
 * window with its ending quietly missing, which is worse than not prefilling at
 * all. Past this length the caller copies the text and opens an empty compose.
 */
export const COMPOSE_URL_LIMIT = 1800
