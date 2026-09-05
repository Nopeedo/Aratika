/**
 * electoral-calendar.ts — the statutory timetable for the 2026 General Election.
 *
 * The data itself lives in electoral-calendar.json so that the notification
 * detector (a .mjs script, which cannot import TypeScript) reads the SAME file
 * this module does. Two copies of an electoral timetable would disagree, and the
 * disagreement would be invisible until it sent someone the wrong deadline.
 *
 * SOURCE: the Electoral Commission's own "2026 General Election timetable",
 * page 6 of the 2026 General Election Media Kit. Labels are the Commission's
 * wording, not a paraphrase. See the `source` block in the JSON.
 *
 * These dates are the one part of this site where being wrong has a cost no
 * correction undoes: someone who misses the enrolment deadline does not get to
 * vote, and no amount of good policy coverage fixes that afterwards. Nothing
 * here is written from memory or carried over from a previous election.
 *
 * 2026 IS NOT 2023. The Electoral Amendment Act closes enrolment 13 days before
 * election day — "once advance voting starts on 26 October, you won't be able to
 * enrol or update your details" (media kit, p7). Election-day enrolment, which
 * existed in 2020 and 2023, is gone. Anyone reasoning from the last election
 * will give advice that disenfranchises people.
 *
 * When updating for a future election, replace the JSON from the Commission's
 * published timetable — never from a search summary, a news article, or memory.
 */

import calendar from './electoral-calendar.json'

export interface ElectoralMilestone {
  /** Stable id — used in the notification dedup key, so never reuse or renumber. */
  id: string
  /** NZ local date, ISO. Where the Commission specifies a time, see `timeNote`. */
  date: string
  /** The Commission's own label. */
  label: string
  /** What it means for a voter, in plain language. */
  detail: string
  /** Set where the deadline is not end-of-day. */
  timeNote?: string
  /**
   * Last day, for milestones that are a period rather than a moment. Only
   * advance voting has one, and the Commission does not print it: see
   * `endDateNote` on that entry for how it is derived and from which page.
   */
  endDate?: string
  /** Why `endDate` says what it says, when the Commission doesn't state it. */
  endDateNote?: string
  /**
   * Whether this is worth interrupting someone for. Administrative milestones
   * (dissolution, nominations closing) are real but are not something a voter
   * has to act on, so they sit in the calendar without notifying.
   */
  notify: boolean
  /**
   * Whether a VOTER has something to do about this, where being told late means
   * the chance is gone — enrolling, switching roll type, casting a vote.
   *
   * Separate from `notify` because the two questions are different: writ day is
   * worth telling people about and impossible to act on, while enrolment
   * closing is the one date on this calendar where a late notice costs someone
   * their vote. detect-electoral-dates.mjs sends actionable milestones
   * immediately from three days out and leaves the rest on the daily digest, so
   * the interrupting channel is reserved for the dates that can still be
   * salvaged when it fires.
   */
  actionable: boolean
  /** Days before the date to warn, in addition to the day itself. */
  remindDaysBefore?: number[]
}

export interface ElectoralSource {
  name: string
  url: string
  page: string
  retrieved: string
}

export const ELECTORAL_SOURCE: ElectoralSource = calendar.source
export const ELECTION_DAY: string = calendar.electionDay
export const ELECTORAL_CALENDAR: ElectoralMilestone[] = calendar.milestones

/** Milestones still ahead of `today` (ISO date), soonest first. */
export function upcomingMilestones(today: string): ElectoralMilestone[] {
  return ELECTORAL_CALENDAR.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date))
}

/** "25 October" — the form the Commission uses in prose, so a date read off the
 *  page matches the one in the timetable. Year omitted: everything in this
 *  calendar is the 2026 cycle and the page says so around it. */
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
export function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : `${d.getUTCDate()} ${LONG_MONTHS[d.getUTCMonth()]}`
}

/** Look up one milestone by id. Returns undefined rather than throwing, so a
 *  renamed id degrades to a missing phrase instead of a blank page. */
export function milestone(id: string): ElectoralMilestone | undefined {
  return ELECTORAL_CALENDAR.find((m) => m.id === id)
}

/** Whole days from `today` to `date`, both ISO dates. Negative once past. */
export function daysUntil(today: string, date: string): number {
  return Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86_400_000)
}
