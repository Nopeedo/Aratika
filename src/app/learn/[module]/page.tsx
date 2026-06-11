/**
 * /learn/[module] — a single interactive learning module.
 * Server shell (header, metadata, static params) wrapping the client experience.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getModule, LEARN_MODULE_IDS } from '@/constants/learn-data'
import { SectionDivider } from '@/components/ui/section-divider'
import { ModuleExperience } from '@/components/learn/module-experience'

const INK = '#0c0e12', SECONDARY = '#6b7078', JADE = '#1F8A4C', BORDER = '#e9e7e2'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function generateStaticParams() {
  return LEARN_MODULE_IDS.map((module) => ({ module }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ module: string }> },
): Promise<Metadata> {
  const { module } = await params
  const m = getModule(module)
  if (!m) return { title: 'Module not found' }
  return { title: `${m.title} — Learn`, description: m.subtitle }
}

export default async function LearnModulePage(
  { params }: { params: Promise<{ module: string }> },
) {
  const { module } = await params
  const m = getModule(module)
  if (!m || m.status !== 'live') notFound()

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-dot-grid" style={{ background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 36px 34px' }}>
          <Link href="/learn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: SECONDARY, textDecoration: 'none', fontFamily: MANROPE, marginBottom: 20 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> All modules
          </Link>
          <div style={{ marginBottom: 8 }}>
            <SectionDivider type="official" label="Interactive Lesson" />
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.02em', color: INK, fontFamily: MANROPE, margin: '0 0 6px', lineHeight: 1.1 }}>{m.title}</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>{m.subtitle}</p>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '30px 36px 64px' }}>
        <ModuleExperience module={m} />

        <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 36, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionDivider type="official" label="Sources" />
          <p style={{ fontSize: 12, color: SECONDARY, fontFamily: MANROPE, margin: 0 }}>
            Based on civics material from parliament.nz and the Electoral Commission (elections.nz). Non-partisan and free to use.
          </p>
        </div>
      </div>
    </div>
  )
}
