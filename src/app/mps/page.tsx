/**
 * /mps — Members of Parliament directory
 *
 * Lists the current MPs with party and role filters and name search.
 * Individual profiles at /mps/[slug].
 *
 * The header used to carry an "Official Parliament Data" badge and a four-line
 * standfirst. The badge went for the reason already written into
 * src/app/bills/page.tsx: it was a claim about the page rather than a fact
 * about any of its rows, and /mps carries no per-row source, so it was the only
 * place the claim was made. The standfirst explained the search box and the
 * pills that are visibly directly below it (§6.1). What was NOT decoration in
 * it — where the roster came from and when — is a dated line now (§4), with the
 * caveats behind one (i) (§1.2).
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MPsDirectory } from '@/components/mps/mps-directory'
import { InfoButton, InfoHeading, InfoText } from '@/components/ui/info-button'
import { MP_PROFILES } from '@/constants/mps-data'
import { TOTAL_SEATS } from '@/constants/parties'
import { INK, JADE_DARK, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

const ROSTER = Object.keys(MP_PROFILES).length
/** From the generator header in src/constants/mps-generated.ts. Anything that
 *  ages says when it was taken (§4). */
const ROSTER_AS_AT = 'June 2026'

export const metadata: Metadata = {
  title: 'Members of Parliament',
  description:
    'The current Members of Parliament in New Zealand\'s 54th Parliament. ' +
    'Search by name, or filter by party and electorate.',
}

// /mps?party=<slug> — the homepage's "See all N X MPs" link lands on that
// caucus already filtered. The directory reads the query itself, so this page
// can be prerendered: awaiting searchParams here made it dynamic, and it was
// answering per request at ~1.6s to first byte.
export default function MPsDirectoryPage() {

  return (
    <div style={WOVEN_PAGE}>

      {/* Header. 1080 is the content column on /bills, /parties and
          /elections, and the grid below it uses the same one, so every block
          on this page starts and ends on the same two vertical lines at 1920
          (§5.19). It was 1280 here and nowhere else. */}
      <div>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px clamp(18px, 5vw, 36px) 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0 }}>
              Members of Parliament
            </h1>
            <InfoButton accent={JADE_DARK} label="Where this roster comes from" size={26}>
              <InfoHeading accent={JADE_DARK}>Where this comes from</InfoHeading>
              <InfoText>
                The roster is taken from Parliament&rsquo;s own list of current members, extracted in {ROSTER_AS_AT}.
                Names, parties and electorates come from there; each MP&rsquo;s own page links back to it.
              </InfoText>
              <InfoHeading accent={JADE_DARK}>What is missing</InfoHeading>
              <InfoText>
                The 54th Parliament has {TOTAL_SEATS} seats and this roster holds {ROSTER} members, so one seat is
                not represented here yet. It moves between captures, and a by-election or a list replacement can
                change it at any time.
              </InfoText>
            </InfoButton>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: TERTIARY, fontFamily: MANROPE, margin: '8px 0 0' }}>
            <b style={{ color: SECONDARY }}>{ROSTER} members</b> of the 54th Parliament, from parliament.nz, as at {ROSTER_AS_AT}
          </p>
        </div>
      </div>

      {/* Directory */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '8px clamp(18px, 5vw, 36px) 64px' }}>
        <Suspense fallback={null}><MPsDirectory /></Suspense>
      </div>
    </div>
  )
}
