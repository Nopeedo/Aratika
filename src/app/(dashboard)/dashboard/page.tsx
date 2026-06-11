/**
 * /dashboard — signed-in landing. Server-gated: redirects to /login without a session.
 * Bookmarks + live MP/bill tracking land here once the bookmarks table + RLS are added.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Star, Bell, BarChart3, Crown, Map, ArrowRight, PenLine, Sparkles, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ManageBillingButton } from '@/components/billing/billing-buttons'

export const metadata: Metadata = { title: 'My Dashboard' }

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', SURFACE = '#f8fafc', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'there'

  const { data: sub } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
  const isPremium = ['active', 'trialing'].includes((sub?.status as string) ?? '')

  return (
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 64px)' }}>
      <div className="bg-dot-grid" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 36px 32px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px' }}>
            Kia ora, {name}
          </h1>
          <p style={{ fontSize: 15, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Welcome to your Aratika dashboard. Signed in as {user.email}.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 36px 64px' }}>

        {/* Premium status / upsell */}
        {isPremium ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            background: 'linear-gradient(145deg,#ecfdf5,#f7fffb)', border: '1px solid #a7f3d0',
            borderRadius: 16, padding: '20px 22px', marginBottom: 28,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles style={{ width: 22, height: 22, color: JADE }} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 800, color: '#065f46', fontFamily: MANROPE }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} /> You’re a Premium member
              </div>
              <div style={{ fontSize: 13, color: '#047857', fontFamily: MANROPE, marginTop: 2 }}>
                Thanks for supporting an independent, non-partisan platform. The Take Action studio is unlocked.
              </div>
            </div>
            <ManageBillingButton />
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            background: 'linear-gradient(145deg,#fff9e6,#fffdf5)', border: '1px solid #fde68a',
            borderRadius: 16, padding: '20px 22px', marginBottom: 28,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Crown style={{ width: 22, height: 22, color: '#b45309' }} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e', fontFamily: MANROPE }}>Unlock the Take Action studio with Premium</div>
              <div style={{ fontSize: 13, color: '#a16207', fontFamily: MANROPE, marginTop: 2 }}>
                Draft letters and submissions, and (soon) bookmark and track MPs, bills and policies.
              </div>
            </div>
            <Link href="/subscription" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#F5C518', color: '#1c1605', fontSize: 13.5, fontWeight: 800, fontFamily: MANROPE, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              <Crown style={{ width: 15, height: 15 }} /> See Premium
            </Link>
          </div>
        )}

        {/* Feature placeholders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { icon: Star, title: 'Tracked MPs', body: 'MPs you bookmark will appear here with their latest votes, speeches and bills.' },
            { icon: BarChart3, title: 'Tracked bills', body: 'Follow bills through the House and see when they reach each stage.' },
            { icon: Bell, title: 'Alerts', body: 'Get notified when something you follow has new activity.' },
          ].map((c) => (
            <div key={c.title} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <c.icon style={{ width: 19, height: 19, color: JADE }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, fontFamily: MANROPE, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: SECONDARY, fontFamily: MANROPE, lineHeight: 1.5 }}>{c.body}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: TERTIARY, fontFamily: MANROPE, marginTop: 12 }}>Coming soon</div>
            </div>
          ))}
        </div>

        {/* Explore */}
        <div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: JADE, color: '#fff', fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
            <Map style={{ width: 15, height: 15 }} /> Find your MP
          </Link>
          <Link href="/take-action" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
            <PenLine style={{ width: 15, height: 15 }} /> Take action
          </Link>
          <Link href="/bills" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, color: INK, fontSize: 13.5, fontWeight: 700, fontFamily: MANROPE, textDecoration: 'none' }}>
            Browse bills <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>
      </div>
    </div>
  )
}
