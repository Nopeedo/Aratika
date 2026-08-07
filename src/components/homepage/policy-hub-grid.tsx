/**
 * PolicyHubGrid — homepage "Where do the parties stand?" section. The topic grid
 * is now INLINE (see PolicyExplorer): tapping a topic opens the simplified party
 * comparison right here, no page change. Fetches approved positions on the server
 * and hands them to the client explorer. Placed directly under the compass.
 */

import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { PolicyExplorer } from '@/components/homepage/policy-explorer'
import { PolicyHubHeading } from '@/components/homepage/policy-hub-heading'

export async function PolicyHubGrid() {
  const positions = await getAllApprovedPositions()

  return (
    // Transparent — the weave now lives on the page wrapper (one continuous
    // texture across the whole homepage), so this section inherits it.
    // overflow-x: hidden clips the heading's feathered glow (which deliberately
    // extends past its own box via negative inset) at the section edge, so it
    // never causes the page itself to overflow/shift sideways on mobile.
    <section style={{ background: 'transparent', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px clamp(18px, 5vw, 36px) 56px' }}>
        {/* "Tap an issue below" now rides inline off the end of the heading —
            see PolicyHubHeading. */}
        <div style={{ marginBottom: 28 }}>
          <PolicyHubHeading />
        </div>

        <PolicyExplorer topicKeys={POLICY_TOPIC_ORDER} positions={positions} />
      </div>
    </section>
  )
}
