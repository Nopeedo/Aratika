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
