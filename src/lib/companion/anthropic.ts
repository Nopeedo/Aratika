/**
 * Lazy Anthropic client for the companion. Reads ANTHROPIC_API_KEY at call time
 * so the build doesn't fail when the key is absent (mirrors getStripe()).
 */

import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    client = new Anthropic({ apiKey })
  }
  return client
}

// Sonnet 4.6 — chosen for accuracy on nuanced political questions.
export const COMPANION_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
