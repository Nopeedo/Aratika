'use client'

/**
 * The two (i) bubbles on /budget, built on the shared ui/info-button.tsx.
 *
 * This file exists to stop a fifth hand-rolled (i) being born. /budget carried
 * one: a raw lucide <Info /> in a bordered box, 321px of orientation standing
 * between the reader and the money. §7 already lists three near-copies of this
 * pattern waiting to be folded into the shared component, and adding another
 * was the most expensive mistake available on this page.
 *
 * What went in here, per §1.2 ("would a reader who has been here before skip
 * this?"): the "this is the Government's Budget, not a party's" callout, the
 * standfirst under the h1, the outlook's forecast caveat, the in-context
 * baseline box, the tag legend over the sector grid, and the licensing prose in
 * the source footer. Nothing was dropped on the way (§5.17): the funding note,
 * the three baseline points and the Treasury taxpayers-money link are all
 * below, because each of them changes how a figure on the page reads.
 */

import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { BUDGET_META } from '@/constants/budget-2026'
import { BUDGET_BASELINE } from '@/constants/budget-links'
import { JADE, JADE_DARK, MANROPE } from '@/constants/theme'

const ACCENT = JADE_DARK

/** The (i) beside the page title. Size 28, matching AboutBillsTracker beside
 *  the /bills h1 (§2.1: 26 default, larger beside a page title). */
export function AboutBudget() {
  return (
    <InfoButton accent={ACCENT} label="About Budget 2026" size={28}>
      <InfoHeading accent={ACCENT}>Whose document this is</InfoHeading>
      <InfoText>
        The Budget is an official document published by The Treasury, not a
        party&rsquo;s. It was delivered by the {BUDGET_META.governmentLabel}. We
        present the figures neutrally and do not take a side on them.
      </InfoText>

      {/* The one part of the old callout that is load-bearing on every figure
          below it, so it gets its own heading rather than a trailing line. */}
      <InfoHeading accent={ACCENT}>How to read the figures</InfoHeading>
      <InfoText>{BUDGET_META.fundingNote}</InfoText>

      <InfoHeading accent={ACCENT}>What we do and don&rsquo;t do</InfoHeading>
      <InfoText>
        We quote Treasury&rsquo;s figures as stated. We do not add up totals
        Treasury did not publish, do not repeat the Government&rsquo;s framing as
        fact, and do not claim a cause for any number.
      </InfoText>

      <InfoHeading accent={ACCENT}>Source</InfoHeading>
      <InfoText>
        All figures from {BUDGET_META.sourceLabel}, Budget {BUDGET_META.year},
        delivered {BUDGET_META.deliveredOn}. Politika summarises the official
        material and does not reproduce it in full. Always check a figure
        against the original.
      </InfoText>
    </InfoButton>
  )
}

/**
 * The (i) beside "Where the money goes". It carries the two blocks that used to
 * sit between that heading and the grid: the baseline box (three sourced points
 * about what is ALREADY being spent) and the legend for the funding tags.
 *
 * The baseline belongs here and not in the body because it is instructions for
 * reading the section below it, which is §1.2's definition of an (i). The
 * Treasury taxpayers-money link comes with it: it is the only sourced instance
 * of the $60b pipeline figure on the site, so moving the block without the link
 * would have been §5.17 all over again.
 */
export function AboutSectors() {
  return (
    <InfoButton accent={ACCENT} label="How to read the sector figures" size={24}>
      <InfoHeading accent={ACCENT}>This is new funding</InfoHeading>
      <InfoText>
        These figures are money added on top of what the Government already
        spends. Read them against the baseline.
      </InfoText>

      <InfoHeading accent={ACCENT}>What is already in place</InfoHeading>
      {BUDGET_BASELINE.points.map((pt) => (
        <InfoText key={pt}>{pt}</InfoText>
      ))}
      <p style={{ margin: '-6px 0 14px' }}>
        <a
          href={BUDGET_BASELINE.source.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 800, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}
        >
          {BUDGET_BASELINE.source.label} &#8599;
        </a>
      </p>

      {/* Only the definitions. The tagging itself is the pill row over the
          grid, so the legend paragraph that explained three chips is gone
          (§2.2: teach the control by making it the control). */}
      <InfoHeading accent={ACCENT}>What the tags mean</InfoHeading>
      <InfoText>
        <b>Ongoing</b> is money committed year after year across the forecast
        period. <b>One-off</b> is a single capital sum, usually a building or a
        piece of infrastructure. <b>Saving</b> is money the Budget stops
        spending.
      </InfoText>
    </InfoButton>
  )
}

/**
 * The (i) beside "The outlook". Treasury's own caveat, which used to be a
 * 73px paragraph above the two cards it qualifies, plus the acronym the
 * summary no longer spells out in the body (§1.7).
 */
export function AboutOutlook() {
  return (
    <InfoButton accent={ACCENT} label="About the outlook" size={24}>
      <InfoHeading accent={ACCENT}>These are forecasts</InfoHeading>
      <InfoText>
        Treasury publishes these as forecasts. We quote them as stated and do not
        add precise figures beyond what Treasury put in words on its summary.
      </InfoText>

      <InfoHeading accent={ACCENT}>OBEGAL</InfoHeading>
      <InfoText>
        The operating balance before gains and losses: the Government&rsquo;s
        day to day surplus or deficit, before one-off investment gains. Treasury
        reports it excluding ACC, so a swing in ACC&rsquo;s accounts does not
        move the headline.
      </InfoText>
    </InfoButton>
  )
}

/**
 * The (i) beside "What Budget 2026 sets out to do". The eight themes are the
 * GOVERNMENT's statement of what its Budget does, and that block was the one
 * place on this page where framing could be read as fact (§1.8). It now says
 * so, beside the heading rather than inside the list.
 */
export function AboutThemes() {
  return (
    <InfoButton accent={ACCENT} label="Whose words these are" size={24}>
      <InfoHeading accent={ACCENT}>Whose words these are</InfoHeading>
      <InfoText>
        These eight lines are the Government&rsquo;s own account of what Budget{' '}
        {BUDGET_META.year} does, as summarised by Treasury. They are what the
        Budget says it does, not our assessment of whether it does it.
      </InfoText>
      <InfoText>
        The figures underneath are the same document&rsquo;s numbers, and they
        can be checked line by line.
      </InfoText>
    </InfoButton>
  )
}
