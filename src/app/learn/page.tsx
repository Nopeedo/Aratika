/**
 * /learn — Politika Learn hub.
 *
 * A title, an (i), and a grid of modules. Everything that used to stand between
 * the reader and that grid has moved or gone:
 *
 * - The SectionDivider type="official" label="Politika Learn" badge. The page
 *   named itself three times above the fold (the metadata title, that badge and
 *   the h1), which is §1.3; and "official" is the site's credibility marker for
 *   verified external data, while these are lessons we wrote. /bills dropped
 *   its own "Official Parliament Data" badge for exactly that reason.
 * - The standfirst, five lines at 375px explaining the ten tappable cards
 *   directly below it. It is the (i) beside the h1 now (§1.2, hub-about.tsx),
 *   which is the same cut and the same arrangement /bills made.
 * - The 54px graduation-cap tile beside the title. It took 54px off the h1's
 *   line and wrapped "How Parliament works" onto two at 375px, for a mark that
 *   says what the h1 and the nav already say.
 * - The progress banner's empty state, which described a scoring system to a
 *   reader who had not met the thing being scored (see learn-progress-banner).
 *
 * Every module in LEARN_MODULES is currently live; the coming-soon branch in
 * hub-modules.tsx stays because it reads each module's own status, so one can
 * be listed before its content is finished. Deliberately no count written down
 * here: the All pill counts the modules it is filtering.
 *
 * Sizing follows the site's clamp() scale, as the rest of the pages do.
 */

import type { Metadata } from 'next'
import { Compass, Landmark } from 'lucide-react'
import { LEARN_MODULES, TIERS, learnGroup } from '@/constants/learn-data'
import { learnTheme } from '@/constants/learn-theme'
import { SignShape } from '@/components/ui/sign-link'
import { AboutLearn } from '@/components/learn/hub-about'
import { HubModules, type HubModule } from '@/components/learn/hub-modules'
import { BORDER, INK, JADE, JADE_DARK, MANROPE, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Learn how Parliament works',
  description:
    'Interactive, beginner-to-expert lessons on how New Zealand’s Parliament and government work, ' +
    'with hands-on widgets and quizzes. Free for everyone.',
}

export default function LearnHubPage() {
  /* The grid needs a title, an icon name, a status and two colours. Mapped here
     rather than in the client component so four tiers of lesson text per module
     stay on the server, which is party-directory.tsx's arrangement. */
  const modules: HubModule[] = LEARN_MODULES.map((m) => {
    const theme = learnTheme(m.id)
    return {
      id: m.id,
      title: m.title,
      icon: m.icon,
      status: m.status,
      group: learnGroup(m.id),
      tint: theme.tint,
      ink: theme.ink,
    }
  })

  return (
    <div style={WOVEN_PAGE}>
      {/* Header. Title, the (i) beside it, then the line that dates the page,
          which is /bills' header arrangement (§1.4). */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(28px, 5vh, 48px) clamp(18px, 5vw, 36px) clamp(26px, 4vh, 42px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(26px, 7vw, 40px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: 0, lineHeight: 1.05 }}>
              How Parliament works
            </h1>
            <AboutLearn />
          </div>

          {/* §4: say the date on anything that ages. The seat counts, the
              party-vote defaults in the seat allocator and the coalition in
              Build a Government are all the 2023 result, and nothing on either
              Learn route said so. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Landmark style={{ width: 16, height: 16, color: JADE_DARK }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: JADE_DARK, fontFamily: MANROPE }}>Examples use the 2023 election result</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px, 4vh, 36px) clamp(18px, 5vw, 36px) 64px' }}>
        <HubModules modules={modules} tiers={TIERS.length} />

        {/* The way out (§2.6), one per section. The hub had none: a reader who
            finished a module, or who arrived here and wanted the practical
            thing rather than the lesson, had the back button. */}
        <div style={{ marginTop: 28 }}>
          <SignShape href="/guide" color={JADE} fg="#fff" icon={<Compass style={{ width: 16, height: 16 }} />}>
            Get started in three questions
          </SignShape>
        </div>
      </div>
    </div>
  )
}
