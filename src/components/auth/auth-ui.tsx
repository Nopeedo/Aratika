'use client'

/** Shared UI for the auth pages (login / register / reset). */

import * as React from 'react'
import { AlertCircle, ArrowRight } from 'lucide-react'

const INK = '#0c0e12', SECONDARY = '#6b7078', TERTIARY = '#9aa0aa'
const BORDER = '#e9e7e2', JADE = '#1F8A4C'
const MANROPE = 'var(--font-manrope), system-ui, sans-serif'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-dot-grid" style={{ background: '#fff', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '64px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#0F172A', color: '#36e08a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, fontFamily: MANROPE }}>A</div>
          <span style={{ fontSize: 19, fontWeight: 800, color: INK, fontFamily: MANROPE }}>Aratika</span>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 2px 4px rgba(12,14,18,.03), 0 24px 48px -28px rgba(12,14,18,.22)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: MANROPE, margin: '0 0 4px', textAlign: 'center' }}>{title}</h1>
          <p style={{ fontSize: 13.5, color: SECONDARY, fontFamily: MANROPE, margin: '0 0 22px', textAlign: 'center' }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Field({ icon: Icon, type, placeholder, value, onChange, autoComplete }: {
  icon: React.ElementType; type: string; placeholder: string; value: string; onChange: (v: string) => void; autoComplete?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
      <Icon style={{ width: 16, height: 16, color: TERTIARY, margin: '0 11px', flexShrink: 0 }} />
      <input
        type={type} placeholder={placeholder} value={value} required autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 11px 11px 0', fontSize: 14, fontFamily: 'var(--font-geist-sans), sans-serif', color: INK }}
      />
    </div>
  )
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      marginTop: 4, padding: '12px', borderRadius: 10, border: 'none',
      background: loading ? '#94d3ad' : JADE, color: '#fff',
      fontSize: 14.5, fontWeight: 700, fontFamily: MANROPE, cursor: loading ? 'default' : 'pointer',
    }}>
      {children} {!loading && <ArrowRight style={{ width: 16, height: 16 }} />}
    </button>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px' }}>
      <AlertCircle style={{ width: 15, height: 15, color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12.5, color: '#b91c1c', fontFamily: MANROPE, lineHeight: 1.4 }}>{message}</span>
    </div>
  )
}
