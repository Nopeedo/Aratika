/**
 * Aratika "Take Action" — letter & submission templates.
 *
 * These are guided scaffolds: Aratika supplies the correct structure, salutation,
 * legal framing (OIA) and helpful prompts, and the citizen writes the letter in
 * their own words. Nothing is auto-sent — the studio produces a draft the person
 * reviews and then sends through official channels.
 */

export type LetterTemplateId = 'mp' | 'submission' | 'minister' | 'oia'
export type RecipientKind = 'mp' | 'minister' | 'committee' | 'agency'

export interface LetterContext {
  recipientName?: string   // person, committee or agency
  recipientRole?: string   // e.g. "MP for Botany", "Minister of Finance"
  recipientEmail?: string  // verified email, if known
  recipientUrl?: string    // official page to verify contact details
  billTitle?: string
  billNumber?: string
  committee?: string
}

export interface LetterInput {
  senderName: string
  senderLocation: string
  senderEmail: string
  subject: string
  body: string
  stance?: 'support' | 'oppose' | 'neither' // submissions
  appear?: boolean                           // submissions
}

export interface LetterTemplate {
  id: LetterTemplateId
  label: string
  short: string
  icon: string             // lucide icon name
  recipientKind: RecipientKind
  blurb: string
  guidance: string[]
  /** Seeds the editable body — the citizen rewrites this in their own words. */
  starter: (ctx: LetterContext) => string
  defaultSubject: (ctx: LetterContext) => string
}

const f = (ctx: LetterContext, key: keyof LetterContext, fallback: string) => ctx[key] || fallback

export const LETTER_TEMPLATES: Record<LetterTemplateId, LetterTemplate> = {
  mp: {
    id: 'mp',
    label: 'Write to your MP',
    short: 'Write to your MP',
    icon: 'Mail',
    recipientKind: 'mp',
    blurb: 'Raise an issue or share your views with a Member of Parliament.',
    guidance: [
      'Be clear about the issue and what you’d like them to do.',
      'Keep it concise and respectful — one page is usually plenty.',
      'Mention your suburb or electorate so they know you’re a constituent.',
      'Stick to facts and your own experience.',
    ],
    defaultSubject: () => 'A matter I’d like to raise',
    starter: (ctx) =>
      `I am writing to you as a constituent regarding [the issue you care about].\n\n` +
      `[Explain why this matters to you — include any personal experience or local impact.]\n\n` +
      `I would like you to [the specific action you are asking for].\n\n` +
      `Thank you for your time and for representing our community.`,
  },

  submission: {
    id: 'submission',
    label: 'Select committee submission',
    short: 'Make a submission',
    icon: 'FileText',
    recipientKind: 'committee',
    blurb: 'Have your say on a bill before Parliament, via the select committee studying it.',
    guidance: [
      'State whether you support, oppose, or partly support the bill.',
      'Focus on specific clauses or effects, and give your reasons.',
      'Say clearly what you’d like the committee to do (pass, amend, or decline).',
      'You can ask to speak to the committee in person.',
      'Lodge it through the official Parliament submission page before the deadline.',
    ],
    defaultSubject: (ctx) => `Submission on the ${f(ctx, 'billTitle', '[bill name]')}`,
    starter: (ctx) =>
      `This is a submission on the ${f(ctx, 'billTitle', '[bill name]')}${ctx.billNumber ? ` (${ctx.billNumber})` : ''}.\n\n` +
      `[Explain your views on the bill. Refer to specific parts where you can, and give reasons and any evidence.]\n\n` +
      `[Set out what you would like the committee to do — for example, pass the bill, amend a particular clause, or decline it.]`,
  },

  minister: {
    id: 'minister',
    label: 'Letter to a Minister',
    short: 'Write to a Minister',
    icon: 'Briefcase',
    recipientKind: 'minister',
    blurb: 'Write to the Minister responsible for a portfolio about a policy or decision.',
    guidance: [
      'Address a matter within the Minister’s portfolio.',
      'Be specific about the decision or policy, and your concern.',
      'State clearly what you are requesting.',
      'Be factual and courteous.',
    ],
    defaultSubject: () => 'A portfolio matter',
    starter: (ctx) =>
      `I am writing to you in your capacity as ${f(ctx, 'recipientRole', 'Minister')} regarding [the matter].\n\n` +
      `[Explain the issue and why it concerns you.]\n\n` +
      `I am asking that [your request].\n\n` +
      `I would appreciate a response outlining the Government’s position.`,
  },

  oia: {
    id: 'oia',
    label: 'Official Information Act request',
    short: 'OIA request',
    icon: 'FileSearch',
    recipientKind: 'agency',
    blurb: 'Request official information from a department, minister or agency under the OIA 1982.',
    guidance: [
      'Describe the information you want as specifically as possible.',
      'You don’t have to give a reason for your request.',
      'The agency must respond as soon as reasonably practicable, and within 20 working days.',
      'Charges may apply for large requests — you can ask for an estimate first.',
      'Send it to the agency that actually holds the information.',
    ],
    defaultSubject: () => 'Request under the Official Information Act 1982',
    starter: () =>
      `Under the Official Information Act 1982, I request the following information:\n\n` +
      `[List the information you are requesting, as specifically as you can — e.g. documents, emails, data, dates or decisions.]\n\n` +
      `If any part of this request is refused, please cite the specific section of the Act relied on. ` +
      `If you intend to charge for this request, please provide an estimate before proceeding.\n\n` +
      `Please provide the information in electronic form where possible.`,
  },
}

export const LETTER_TEMPLATE_ORDER: LetterTemplateId[] = ['mp', 'submission', 'minister', 'oia']
