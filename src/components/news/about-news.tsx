'use client'

/**
 * AboutNews — the (i) beside "The Latest", carrying what the page's standfirst
 * and its transparency footer used to say in the body.
 *
 * The footer was the last thing on /news, three-plus screens below the party
 * pills it explains. The paragraph about WHY one party gets more coverage is
 * the most valuable thing on the page (§8, "where do these stats come from?")
 * and it was the furthest thing from the control it qualifies. Behind the (i)
 * at the top it is finally where someone would look for it (§1.2).
 *
 * The five-outlet link row that sat under it is gone: every card already
 * carries its outlet as a badge and a "Read at {outlet}" link, so those were
 * five more links to places the page links to on every row (§1.3). The outlet
 * NAMES survive here as a sentence, which is the fact they carried.
 */

import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { JADE_DARK } from '@/constants/theme'
/* Plain data, deliberately not declared in this file: a server component
   importing it from here would get a client reference, not the array. */
import { OUTLET_NAMES } from '@/constants/news-outlets'

const ACCENT = JADE_DARK


export function AboutNews() {
  return (
    <InfoButton accent={ACCENT} label="About this feed" size={28}>
      {/* The outlets themselves are named on the page, in the one visible
          source line under the feed, so they are not repeated here (§1.3).
          What the page cannot show is how a story gets its tags. */}
      <InfoHeading accent={ACCENT}>How the tags work</InfoHeading>
      <InfoText>
        Party and issue tags are applied automatically, using the same rules for
        every registered party. We never rank or rate them, and a tag means the
        story named that party, not that the party agrees with it.
      </InfoText>

      {/* The paragraph that was the last thing on the page. */}
      <InfoHeading accent={ACCENT}>Why one party has more</InfoHeading>
      <InfoText>
        How much coverage each party gets reflects how much the news media write
        about them, not an editorial choice by us. Larger parties are written
        about more often. One of our sources is the Beehive, the
        Government&rsquo;s own release feed, which naturally carries more from
        whichever parties are in government.
      </InfoText>

      {/* §1.5 and §1.8: the page shows a window, not the record, and nothing on
          it said so. getNews() reads the newest 150 approved rows and keeps the
          ones tagged election-relevant, so a story can be missing because it
          fell out of that window rather than because nobody wrote it. */}
      <InfoHeading accent={ACCENT}>What this list covers</InfoHeading>
      <InfoText>
        The newest stories our sources have published that relate to the 2026
        election. It is a recent window, not a complete archive, so an older
        story can drop off it.
      </InfoText>
    </InfoButton>
  )
}

/** The (i) beside the video rail. The rail's two blurbs, which used to be two
 *  paragraphs under two separate headings, and the fact the merged rail has to
 *  keep saying: who asked the questions. */
export function AboutVideo() {
  return (
    <InfoButton accent={ACCENT} label="About these videos" size={24}>
      <InfoHeading accent={ACCENT}>What is in here</InfoHeading>
      <InfoText>
        Press standups, leader updates and debates from parties&rsquo; official
        channels, alongside long-form interviews with leaders and candidates from
        news outlets.
      </InfoText>

      <InfoHeading accent={ACCENT}>Who asked the questions</InfoHeading>
      <InfoText>
        Every card names the channel or outlet it came from, because an interview
        is a party&rsquo;s voice getting extended airtime on someone
        else&rsquo;s platform. The questions are not ours, and neither are the
        answers.
      </InfoText>

      <InfoHeading accent={ACCENT}>How they play</InfoHeading>
      <InfoText>
        Videos open in a privacy-enhanced YouTube player. We embed, we do not
        rehost.
      </InfoText>
    </InfoButton>
  )
}
