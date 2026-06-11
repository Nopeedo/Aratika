'use client'

/**
 * MPFinderSearch — client component
 *
 * The hero search bar for finding your electorate MP by suburb or address.
 * Currently navigates to /map with the search query as a URL parameter.
 *
 * Designed to be AI-upgradeable in Phase 3 — the input and submit handler
 * will be extended to call the AI assistant endpoint rather than a simple
 * URL redirect. The component shape does not need to change.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

export function MPFinderSearch() {
  const router                  = useRouter()
  const [query, setQuery]       = React.useState('')
  const [focused, setFocused]   = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/map?search=${encodeURIComponent(q)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 560 }}>
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          background:   '#ffffff',
          border:       `2px solid ${focused ? '#1F8A4C' : '#e9e7e2'}`,
          borderRadius: 14,
          overflow:     'hidden',
          boxShadow:    focused
            ? '0 0 0 4px rgba(31,138,76,0.12)'
            : '0 2px 8px rgba(12,14,18,0.06)',
          transition:   'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {/* Search icon */}
        <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Search
            style={{
              width: 18, height: 18,
              color: focused ? '#1F8A4C' : '#9aa0aa',
              transition: 'color 0.15s',
            }}
          />
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Type your suburb or address..."
          aria-label="Search for your electorate by suburb or address"
          style={{
            flex:        1,
            border:      'none',
            outline:     'none',
            padding:     '14px 0',
            fontSize:    15,
            fontFamily:  'var(--font-geist-sans), system-ui, sans-serif',
            color:       '#0c0e12',
            background:  'transparent',
          }}
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!query.trim()}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            6,
            margin:         5,
            padding:        '10px 18px',
            borderRadius:   10,
            border:         'none',
            background:     query.trim() ? '#1F8A4C' : '#e9e7e2',
            color:          query.trim() ? '#ffffff' : '#9aa0aa',
            fontSize:       14,
            fontWeight:     700,
            fontFamily:     'var(--font-manrope), system-ui, sans-serif',
            cursor:         query.trim() ? 'pointer' : 'default',
            transition:     'background 0.15s, color 0.15s',
            whiteSpace:     'nowrap',
            flexShrink:     0,
          }}
        >
          Find My MP
          <ArrowRight style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* Helper text */}
      <p style={{
        fontSize:   12,
        color:      '#9aa0aa',
        marginTop:  8,
        fontFamily: 'var(--font-manrope), system-ui, sans-serif',
      }}>
        Works with suburbs, street addresses, and electorate names ·{' '}
        <a
          href="/how-it-works#mmp"
          style={{ color: '#1F8A4C', textDecoration: 'none', fontWeight: 600 }}
        >
          Not sure which roll you're on?
        </a>
      </p>
    </form>
  )
}
