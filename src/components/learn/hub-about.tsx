'use client'

/**
 * AboutLearn — the (i) beside the /learn hub's h1.
 *
 * It carries the standfirst that used to sit under the title: "Learn how New
 * Zealand's democracy works by doing, not by reading. Each module has hands-on
 * widgets, a quick quiz, and four levels from Kids to Expert. Always free."
 * That is five lines at 375px explaining the ten tappable cards directly below
 * it, and §1.2's test settles it: a reader who has been here before skips it,
 * so it is an (i). Same cut, same arrangement, as the six lines that came off
 * /bills (see about-bills-tracker.tsx).
 *
 * The (i) is the shared §2.1 component, not a fourth hand-rolled copy of it.
 */

import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'

/** The hub's own colour: the site jade, which is also the accent the module
 *  tiles fall back to. Per-module hues belong to the modules (§1.6). */
const ACCENT = '#1F8A4C'

export function AboutLearn() {
  return (
    <InfoButton accent={ACCENT} label="About Politika Learn" size={28}>
      <InfoHeading accent={ACCENT}>What this is</InfoHeading>
      <InfoText>
        Short modules on how New Zealand’s Parliament and elections actually
        work. Each one has something to move or try and a quick check at the
        end, so you meet the mechanism by using it rather than by reading about
        it.
      </InfoText>

      <InfoHeading accent={ACCENT}>The four levels</InfoHeading>
      <InfoText>
        Every module is written four times over: Kids, Beginner, Intermediate
        and Expert. The same subject at four depths. You switch between them
        inside the module, at any point, and each one you finish is counted on
        its card here.
      </InfoText>

      <InfoHeading accent={ACCENT}>What it costs</InfoHeading>
      <InfoText>
        Nothing, and you do not need an account to read any of it. An account
        only keeps a record of which levels you have finished, so it follows you
        off this browser.
      </InfoText>
    </InfoButton>
  )
}
