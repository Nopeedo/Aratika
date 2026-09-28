'use client'

/**
 * ElectoratePanel — the detail panel beside the map, in §2.4's fixed order.
 *
 * It answered the same question the battlegrounds panel answers, in a different
 * shape: a 22px h2 against a 19px h3, a JADE filled CTA against an INK one, and
 * four different labels for one field ("Electorate MP · 2023 result" here,
 * "Electorate MP" in electorate-tiles, "2023 winner" on /battlegrounds). The
 * row order is §2.4's now, the way out is the §2.6 signpost, and the Track
 * control is §2.13's shape in the title row rather than a second full-width
 * button stacked under the primary one.
 *
 * Two facts, two labels, and this is the one that was WRONG rather than just
 * inconsistent: `info.party` is the party that WON the seat in 2023, and two
 * sitting MPs have left the party they won it for. The identity block names
 * the party the MP is in NOW (from MP_PROFILES) and the 2023 result is stated
 * beside it as history.
 *
 * What left this file: the empty state's paragraph, which restated the page
 * standfirst almost word for word (§1.3), and the four-line MMP explainer
 * pinned under every selection, which is a section of the (i) beside the page
 * title now (§1.2) — a reader who has been here before skipped it 72 times.
 */

import Link from 'next/link'
import { MapPin, ArrowRight, Info, Vote, MousePointerClick } from 'lucide-react'
import { TrackWithAccount } from '@/components/bookmarks/track-with-account'
import { getElectorate } from '@/constants/electorates-data'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_PROFILES } from '@/constants/parties-data'
import { Avatar } from '@/components/ui/avatar'
import { formatNumber, toSlug } from '@/lib/utils/format'
import { BORDER, DISPLAY, INK, JADE, MANROPE, SECONDARY, SURFACE, TERTIARY } from '@/constants/theme'

export function ElectoratePanel({ electorateName }: { electorateName: string | null }) {

  // ── Empty state ──
  // One line. The paragraph that stood here ("Click any electorate on the map,
  // or search your suburb…") repeated the page standfirst, which is itself now
  // in the (i). It also said "Click" on a phone-first site, twice, while the
  // embedded panel two files away said "Tap" (§8).
  if (!electorateName) {
    return (
      <div style={panelWrap}>
        <style dangerouslySetInnerHTML={{ __html: PANEL_CSS }} />
        <div style={{ textAlign: 'center', padding: '32px 24px', color: TERTIARY }}>
          <MousePointerClick style={{ width: 32, height: 32, margin: '0 auto 12px', color: '#cbd0d6' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: INK, fontFamily: MANROPE, margin: 0 }}>
            Tap your electorate
          </p>
        </div>
      </div>
    )
  }

  const info      = getElectorate(electorateName)
  const hasHolder = !!(info && info.party && info.mpName)
  // Derive the profile slug from the MP name; link only if that profile exists.
  const profileSlug = info?.mpSlug ?? (info?.mpName ? toSlug(info.mpName) : undefined)
  const mp          = profileSlug ? MP_PROFILES[profileSlug] ?? null : null

  /* The MP's party NOW, falling back to the 2023 winner's only when there is no
     profile to read it from. Te Tai Tokerau and Te Tai Tonga read Te Pāti Māori
     from `info.party` while /mps and /battlegrounds both say Independent, so
     this panel was pairing two named people with a party they had left. */
  const sittingSlug = mp?.party ?? info?.party ?? null
  const sitting     = sittingSlug ? PARTY_PROFILES[sittingSlug] : null
  const wonFor      = info?.party ? PARTY_PROFILES[info.party] : null
  const switched    = !!(sittingSlug && info?.party && sittingSlug !== info.party)

  return (
    <div style={panelWrap}>
      {/* Mounted in BOTH branches. §3.2: the bills panel's phone sizing was
          mounted inside one branch and the tallest card on the page never
          received any of it. */}
      <style dangerouslySetInnerHTML={{ __html: PANEL_CSS }} />

      {/* 1. Badge left, and the §2.13 Track control right, in the title row —
             not a second full-width button stacked under the way out. */}
      <div className="ep-head" style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
            color: info?.type === 'maori' ? '#B11226' : JADE, fontFamily: MANROPE,
          }}>
            {info?.type === 'maori' ? 'Māori electorate' : 'General electorate'}
            {info?.region ? <span style={{ color: TERTIARY, letterSpacing: 0, textTransform: 'none', fontWeight: 600 }}> · {info.region}</span> : null}
          </span>
          {info && sitting && (
            <TrackWithAccount
              entity={{
                kind: 'electorate', refId: electorateName,
                label: electorateName,
                sublabel: info.mpName ? `${info.mpName} · ${sitting.name}` : (info.type === 'maori' ? 'Māori electorate' : 'General electorate'),
                href: `/map?search=${encodeURIComponent(electorateName)}`,
                accent: sitting.color,
              }}
              label="Track"
              savedLabel="Tracking"
              accent={sitting.color}
            />
          )}
        </div>

        {/* 2. Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin style={{ width: 18, height: 18, color: INK, flexShrink: 0 }} />
          <h2 style={{ fontSize: 'clamp(17px, 2.6vw, 21px)', fontWeight: 800, letterSpacing: '-.01em', color: INK, fontFamily: MANROPE, margin: 0 }}>
            {electorateName}
          </h2>
        </div>
      </div>

      {hasHolder && sitting && info ? (
        <div className="ep-body" style={{ padding: '16px 20px 20px' }}>
          {/* 4. Label. "Sitting MP", not "Electorate MP · 2023 result": the
                 block below it is about who represents this seat today, and
                 the 2023 result is a separate row with its own label. */}
          <div className="ep-label" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: TERTIARY, fontFamily: MANROPE, marginBottom: 11 }}>
            Sitting MP
          </div>

          {/* 5. Identity — wrapped in a profile link only when a profile exists */}
          {(() => {
            const identity = (
              <div style={{ display: 'flex', gap: 13, alignItems: 'center', marginBottom: 14 }}>
                <Avatar name={info.mpName!} party={sittingSlug!} src={mp?.photo} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {mp?.title && (
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, marginBottom: 2 }}>
                      {mp.title}
                    </div>
                  )}
                  <div className="ep-name" style={{ fontSize: 17, fontWeight: 800, color: INK, fontFamily: MANROPE, lineHeight: 1.15 }}>
                    {info.mpName}
                  </div>
                  <span style={{
                    display: 'inline-flex', marginTop: 6, fontSize: 11, fontWeight: 700,
                    background: sitting.color, color: sitting.textColor,
                    borderRadius: 999, padding: '3px 10px', fontFamily: MANROPE,
                  }}>
                    {sitting.name}
                  </span>
                </div>
                {mp && <ArrowRight style={{ width: 16, height: 16, color: TERTIARY, flexShrink: 0 }} />}
              </div>
            )
            return mp
              ? <Link href={`/mps/${mp.slug}`} style={{ textDecoration: 'none', display: 'block' }}>{identity}</Link>
              : identity
          })()}

          {/* 6. Meta. The 2023 result, labelled as 2023, so the party chip
                 above can be the MP's party now without the two contradicting
                 each other (§1.5: the change is stated, not hidden). */}
          {switched && wonFor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 8 }}>
              <Info style={{ width: 14, height: 14, color: TERTIARY, flexShrink: 0 }} />
              <span className="ep-sub" style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.45 }}>
                Won this seat for {wonFor.name} in 2023.
              </span>
            </div>
          )}
          {typeof info.majority === 'number' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 14 }}>
              <Vote style={{ width: 15, height: 15, color: TERTIARY, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: SECONDARY, fontFamily: MANROPE }}>2023 majority</span>
              <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: INK, fontFamily: DISPLAY }}>
                {formatNumber(info.majority)}
              </span>
            </div>
          )}

          {/* 7. One way out of the panel (§2.6). Where there is no profile the
                 panel says what IS here rather than promising a date it does
                 not have (§1.5, §4: "Full profile coming soon" had neither). */}
          {mp ? (
            <Link href={`/mps/${mp.slug}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '11px 16px', borderRadius: 11, background: sitting.color, color: sitting.textColor,
              fontSize: 14, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none',
            }}>
              {info.mpName?.split(' ')[0]}’s full profile <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 14px', borderRadius: 11, border: `1px dashed ${BORDER}`,
              background: SURFACE, color: TERTIARY, fontSize: 12.5, fontWeight: 600, fontFamily: MANROPE, textAlign: 'center', lineHeight: 1.4,
            }}>
              No profile page for this MP yet. The 2023 result above is the full record we hold.
            </div>
          )}

          {/* 8. Source. §4: every number above is a 2023 result, and the panel
                 had never said so or dated it. */}
          <p style={{ fontSize: 11, color: TERTIARY, fontFamily: MANROPE, margin: '12px 0 0', lineHeight: 1.5 }}>
            Electoral Commission 2023 official results, as at July 2026.
          </p>
        </div>
      ) : (
        // §1.5, and the true gap named. It used to say "MP data pending … once
        // verified against the Electoral Commission's official 2023 results",
        // which promises verification that is already done: every row in
        // electorates-data is `verified: true`. This branch only fires when a
        // GeoJSON boundary name does not normalise onto a record.
        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: 10, padding: '13px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
            <Info style={{ width: 16, height: 16, color: '#1e40af', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#1e3a8a', fontFamily: MANROPE, margin: 0, lineHeight: 1.5 }}>
              <b>No record for this boundary.</b> We could not match it to an electorate in our
              2023 results, so we are not going to guess who holds it.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const panelWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%',
  background: '#ffffff',
}

/* The desktop step this file never had. Every size in it was composed at 375px
   and rendered unchanged at 1920, where the panel sits beside a map that has
   grown to fill the column: an 11px label and a 12px body against a 17px name,
   in a box roughly twice the width it was designed in.

   Scaled, not re-laid-out (§2.14): the order, the proportions and the reserved
   heights are the phone's, one step larger. 768px to match every other
   breakpoint on the site, so crossing it is one change of scale.

   !important because the values it overrides are inline styles on the same
   elements (§3.2). */
const PANEL_CSS = `
@media (min-width: 768px) {
  .ep-head { padding: 20px 24px 17px !important; }
  .ep-body { padding: 20px 24px 24px !important; }
  .ep-eyebrow { font-size: 11.5px !important; }
  .ep-label { font-size: 12px !important; }
  .ep-name { font-size: 20px !important; }
  .ep-sub { font-size: 13px !important; }
}
`
