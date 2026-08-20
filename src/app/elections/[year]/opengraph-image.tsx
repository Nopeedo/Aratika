/** Election Centre card. Leads with the enrolment deadline rather than the
 *  countdown: the date most people get wrong is the one worth putting on a
 *  share card, and it is the same figure the key-dates strip shows. */
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og/card'
import { ELECTORAL_CALENDAR } from '@/constants/electoral-calendar'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = '2026 General Election — key dates'

export default async function Image() {
  const enrol = ELECTORAL_CALENDAR.find((m) => m.id === 'enrolment-closes-2026')
  return ogCard({
    eyebrow: 'Election Centre',
    title: 'Enrolment closes before advance voting opens',
    subtitle: enrol ? 'New for 2026 — you cannot enrol on election day' : undefined,
    stat: { value: '25 Oct', label: 'last day to enrol' },
    accent: '#B42318',
  })
}
