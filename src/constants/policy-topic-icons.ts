/**
 * TOPIC_ICONS — the one place a policy topic's icon name resolves to a component.
 *
 * This map used to be copy-pasted into seven files: both bill components, four
 * homepage components, and both policy pages. They were identical and had to
 * stay identical, so adding a topic meant finding all seven — and a topic whose
 * icon is missing from one of them renders as a blank space in that one place
 * only, which is the kind of gap you find months later on a page you rarely
 * open.
 *
 * POLICY_TOPICS carries the icon NAME as a string rather than a component so
 * that the topic metadata stays a plain data file. This is the other half of
 * that arrangement, and the only thing that needs updating when a topic is
 * added.
 */

import {
  Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users, Vote,
} from 'lucide-react'

export const TOPIC_ICONS: Record<string, React.ElementType> = {
  Home, Heart, TrendingUp, Leaf, GraduationCap, Scale, Globe, Landmark, Wind, Users, Vote,
}
