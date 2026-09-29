/**
 * Types for the receipt renderer.
 *
 * template.mjs is deliberately plain JavaScript with no imports, so that BOTH
 * the cron script (scripts/donation-receipts.mjs, run straight by node) and the
 * webhook route (TypeScript, bundled by Next) can share one copy of it. The
 * alternative was a second copy in src/, and the copy that drifted would have
 * been the one donors actually receive.
 */
export function renderReceipt(input: {
  name?: string | null
  amountCents: number
  currency?: string | null
  reference: string
  paidAt?: string | null
  siteUrl?: string | null
}): { subject: string; html: string; text: string }
