/**
 * AllPartiesSection — server wrapper that fetches approved positions and hands
 * them to the client-side all-parties comparison. Sits below the electorate map.
 */

import { POLICY_TOPIC_ORDER } from '@/constants/policy-topics'
import { getAllApprovedPositions } from '@/lib/positions/live'
import { AllPartiesCompare } from '@/components/homepage/all-parties-compare'

export async function AllPartiesSection() {
  const positions = await getAllApprovedPositions()
  return <AllPartiesCompare topicKeys={POLICY_TOPIC_ORDER} positions={positions} />
}
