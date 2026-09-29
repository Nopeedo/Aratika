/**
 * Signing for the Politika <-> Onebyone donation messages.
 *
 * Both directions (Politika asking Onebyone to open a checkout, Onebyone
 * telling Politika a payment was paid) carry:
 *   X-Politika-Timestamp: unix seconds
 *   X-Politika-Signature: hex HMAC-SHA256(DONATE_SHARED_SECRET, `${ts}.${rawBody}`)
 * and are refused when more than five minutes old. The same scheme lives in
 * Onebyone's backend at app/services/politika.py; the secret is the same
 * value on both sides (POLITIKA_SHARED_SECRET there). It is not an Onebyone
 * credential: it can't reach Onebyone's Stripe account or data, only vouch
 * for these two messages.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const MAX_SKEW_SECONDS = 300

export function donateSecret(): string | null {
  return process.env.DONATE_SHARED_SECRET || null
}

export function sign(rawBody: string, timestamp: string, secret: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
}

export function verify(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  const secret = donateSecret()
  if (!secret || !timestamp || !signature) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_SECONDS) return false
  const expected = Buffer.from(sign(rawBody, timestamp, secret), 'hex')
  const given = Buffer.from(signature, 'hex')
  return expected.length === given.length && timingSafeEqual(expected, given)
}
