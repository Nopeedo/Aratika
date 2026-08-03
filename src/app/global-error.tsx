'use client'

/**
 * global-error.tsx — the app-wide client error boundary. Catches render errors
 * anywhere in the tree that would otherwise show a blank/broken page, reports
 * them (issue: "zero error tracking"), and shows a calm recovery screen instead
 * of a stack trace. Must render its own <html>/<body> — it replaces the root
 * layout when it triggers.
 */

import { useEffect } from 'react'
import { reportError } from '@/lib/observability/report'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: 'global-error' })
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#17231b' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 440, textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1F8A4C', margin: '0 auto 18px' }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>Something went wrong</h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b5563', margin: '0 0 20px' }}>
              A problem stopped this page loading. It has been logged, and you can try again.
            </p>
            <button onClick={() => reset()} style={{ background: '#1F8A4C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, padding: '11px 20px', borderRadius: 10, cursor: 'pointer' }}>
              Try again
            </button>
            <p style={{ marginTop: 18 }}>
              <a href="/" style={{ color: '#1F8A4C', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>← Back to Arapono</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
