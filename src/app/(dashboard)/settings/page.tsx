/**
 * /settings — account, notifications and subscription in one place.
 *
 * These controls all lived on /dashboard, stacked under the tracked items. They
 * are set-up decisions someone makes once and then never touches, and they were
 * taking prime vertical space on the page a returning visitor opens to see what
 * moved. The dashboard is for what changed; this is for how it reaches you.
 *
 * It also closes a dangling link: the account menu used to offer "Account
 * Settings" pointing at /account, which was never built, so every signed-in user
 * who opened that menu had a 404 waiting. The item was removed with a note to
 * restore it when a real settings page existed. This is that page.
 *
 * Server-gated the same way /dashboard is — no session, no page.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Bell, Crown, Sparkles, CheckCircle2, UserRound, KeyRound, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NotifyToggle } from '@/components/notifications/notify-toggle'
import { EmailToggle } from '@/components/notifications/email-toggle'
import { InstallButton } from '@/components/notifications/install-button'
import { ManageBillingButton } from '@/components/billing/billing-buttons'
import { PREMIUM_ENABLED } from '@/constants/features'
import { isEnabled } from '@/constants/features'
import { SignOutButton } from './sign-out-button'
import { BORDER, INK, JADE, MANROPE, SECONDARY, TERTIARY, WOVEN_PAGE } from '@/constants/theme'

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
}

function Card({ icon: Icon, title, blurb, children }: {
  icon: React.ElementType; title: string; blurb?: string; children: React.ReactNode
}) {
  return (
    <section style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: blurb ? 4 : 14 }}>
        <Icon style={{ width: 17, height: 17, color: JADE, flexShrink: 0 }} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: 0 }}>{title}</h2>
      </div>
      {blurb && <p style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 14px', lineHeight: 1.55 }}>{blurb}</p>}
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'baseline', padding: '9px 0', borderTop: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, minWidth: 110 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: INK, fontFamily: MANROPE, wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

/** "12 August 2026" from an ISO timestamp, in UTC so it never differs between
 *  the server render and the browser. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function joined(iso?: string): string {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? 'Unknown' : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/settings')

  const { data: prefs } = await supabase
    .from('notification_prefs').select('email_digest_enabled').eq('user_id', user.id).maybeSingle()
  const emailDigestEnabled = prefs?.email_digest_enabled ?? true

  const { data: sub } = await supabase
    .from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
  const isPremium = !PREMIUM_ENABLED || ['active', 'trialing'].includes((sub?.status as string) ?? '')

  return (
    <div style={WOVEN_PAGE}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px clamp(18px, 5vw, 36px) 64px' }}>

        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: SECONDARY, fontFamily: MANROPE, textDecoration: 'none', marginBottom: 16 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to dashboard
        </Link>

        <h1 style={{ fontSize: 'clamp(26px, 6vw, 34px)', fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>
          Settings
        </h1>
        <p style={{ fontSize: 14.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 26px', lineHeight: 1.6 }}>
          Your account, and how Arapono reaches you. What you follow lives on your{' '}
          <Link href="/dashboard" style={{ color: JADE, fontWeight: 700 }}>dashboard</Link>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Card icon={UserRound} title="Account">
            <div>
              <Row label="Email" value={user.email ?? 'Not set'} />
              <Row label="Member since" value={joined(user.created_at)} />
              <Row label="Sign-in method" value={user.app_metadata?.provider === 'google' ? 'Google' : 'Email and password'} />
            </div>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 16 }}>
              {/* Password reset goes through the existing emailed-link flow rather
                  than a form here — it is the same path a locked-out user takes,
                  so there is only one way in and one thing to keep working. */}
              {user.app_metadata?.provider !== 'google' && (
                <Link href="/forgot-password" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '9px 14px', fontSize: 13.5, fontWeight: 700, color: INK, fontFamily: MANROPE, textDecoration: 'none' }}>
                  <KeyRound style={{ width: 15, height: 15 }} /> Change password
                </Link>
              )}
              <SignOutButton />
            </div>
          </Card>

          <Card
            icon={Bell}
            title="Notifications"
            blurb="These only ever cover what you follow. Nothing here sends you general news."
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <NotifyToggle />
              <EmailToggle initialEnabled={emailDigestEnabled} />
              <InstallButton />
            </div>
          </Card>

          {isEnabled('premium') && (
            <Card icon={isPremium ? Sparkles : Crown} title="Subscription">
              {isPremium ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14.5, fontWeight: 800, color: '#065f46', fontFamily: MANROPE }}>
                      <CheckCircle2 style={{ width: 16, height: 16 }} /> Premium member
                    </div>
                    <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, marginTop: 3, lineHeight: 1.55 }}>
                      Thanks for supporting an independent, non-partisan platform.
                    </div>
                  </div>
                  <ManageBillingButton />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220, fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.55 }}>
                    You’re on the free plan. Everything that matters for deciding your vote is free and stays free.
                  </div>
                  <Link href="/subscription" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: '#F5C518', color: '#1c1605', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    <Crown style={{ width: 15, height: 15 }} /> See Premium
                  </Link>
                </div>
              )}
            </Card>
          )}

          <Card icon={ArrowRight} title="Your data">
            <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 12px', lineHeight: 1.6 }}>
              What we hold, and what we deliberately don’t, is set out in full on the privacy page.
              To stop everything at once, turn both notification settings off above.
            </p>
            <Link href="/privacy" style={{ fontSize: 13.5, fontWeight: 700, color: JADE, fontFamily: MANROPE, textDecoration: 'none' }}>
              Read the privacy policy →
            </Link>
          </Card>

        </div>
      </div>
    </div>
  )
}
