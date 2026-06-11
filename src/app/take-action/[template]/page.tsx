/**
 * /take-action/[template] — a single drafting tool.
 * Server shell: resolves recipient/bill context from the query (?to=mp-slug,
 * ?bill=bill-slug), builds a sample for the gated preview, and renders the
 * Premium-gated studio.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  LETTER_TEMPLATES, LETTER_TEMPLATE_ORDER, type LetterTemplateId, type LetterContext,
} from '@/constants/letter-templates'
import { assembleLetter } from '@/lib/letter/build'
import { MP_PROFILES } from '@/constants/mps-data'
import { PARTY_NAMES } from '@/constants/parties'
import { getBill } from '@/constants/bills-data'
import { SectionDivider } from '@/components/ui/section-divider'
import { PremiumGate } from '@/components/action/premium-gate'
import { LetterStudio, LetterPreview } from '@/components/action/letter-studio'

const INK = '#0c0e12', SECONDARY = '#6b7078', JADE = '#1F8A4C', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function generateStaticParams() {
  return LETTER_TEMPLATE_ORDER.map((template) => ({ template }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ template: string }> },
): Promise<Metadata> {
  const { template } = await params
  const t = LETTER_TEMPLATES[template as LetterTemplateId]
  if (!t) return { title: 'Template not found' }
  return { title: `${t.label} — Take Action`, description: t.blurb }
}

function mpRole(slug: string): string {
  const mp = MP_PROFILES[slug]
  if (!mp) return ''
  if (mp.title) return mp.title
  if (mp.role === 'electorate' && mp.electorate) return `MP for ${mp.electorate}`
  return `${PARTY_NAMES[mp.party].short} list MP`
}

export default async function TakeActionTemplatePage(
  { params, searchParams }: {
    params: Promise<{ template: string }>
    searchParams: Promise<{ to?: string; bill?: string }>
  },
) {
  const { template } = await params
  const sp = await searchParams
  const t = LETTER_TEMPLATES[template as LetterTemplateId]
  if (!t) notFound()

  // Build recipient/bill context from the query.
  let ctx: LetterContext = {}
  if (sp.to && MP_PROFILES[sp.to]) {
    const mp = MP_PROFILES[sp.to]
    ctx = { recipientName: mp.name, recipientRole: mpRole(sp.to), recipientEmail: mp.email, recipientUrl: mp.parliamentUrl }
  }
  if (sp.bill) {
    const bill = getBill(sp.bill)
    if (bill) {
      ctx = {
        ...ctx,
        billTitle: bill.title,
        billNumber: bill.number,
        committee: bill.selectCommittee,
        recipientName: bill.selectCommittee ? `${bill.selectCommittee}` : ctx.recipientName,
      }
    }
  }

  // Sample letter for the gated preview shown to non-subscribers.
  const sample = assembleLetter(t, {
    senderName: '', senderLocation: '', senderEmail: '',
    subject: t.defaultSubject(ctx), body: t.starter(ctx), stance: 'support', appear: false,
  }, ctx)

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 36px 32px' }}>
          <Link href="/take-action" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 18 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All templates
          </Link>
          <div style={{ marginBottom: 8 }}><SectionDivider type="official" label="Take Action · Premium" /></div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.1 }}>{t.label}</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            {t.blurb}{ctx.recipientName ? ` · To: ${ctx.recipientName}` : ''}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 36px 64px' }}>
        <PremiumGate
          featureName={t.label}
          preview={<LetterPreview text={sample} />}
          perks={[
            'All four templates: MP letters, submissions, ministerial letters, OIA requests',
            'Guided structure + official wording — you write it in your own words',
            'Copy, download, print or email, with official-channel links',
            'Private: drafted in your browser, never stored or auto-sent',
          ]}
        >
          <LetterStudio templateId={t.id} ctx={ctx} />
        </PremiumGate>
      </div>
    </div>
  )
}
