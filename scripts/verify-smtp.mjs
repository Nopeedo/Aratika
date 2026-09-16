/**
 * verify-smtp.mjs — can we still log in to send mail? Sends nothing.
 *
 * Opens a TLS connection to Zoho and authenticates with the same credentials
 * the newsletter and bill-alert scripts use, then hangs up. No message is
 * composed, no recipient is touched.
 *
 * Why this exists: the SMTP login is a GitHub secret, so it cannot be tested
 * from a developer machine, and the scripts that use it only exercise it when
 * there is something to send — a weekly newsletter, a bill opening for
 * submissions. A credential that stops working is therefore invisible until
 * the next real send fails, and the first sign is a subscriber asking why the
 * newsletter stopped. This turns that into a red run and an email instead.
 *
 * Written on 16 Sep 2026, the day the mailbox address behind the login changed
 * (hello@arapono.org.nz -> hello@politika.nz) and the secret had to follow.
 *
 * Run: node scripts/verify-smtp.mjs
 * Exit 0 = authenticated. Exit 1 = could not, with the reason. Exit 2 = the
 * secrets are not set at all, which is a configuration fault, not a mail one.
 */

import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { maskEmail } from './lib/notify.mjs'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'), quiet: true })

const user = process.env.ZOHO_SMTP_USER
const pass = process.env.ZOHO_SMTP_PASS

if (!user || !pass) {
  // Say which one, without saying what it is.
  console.error(`SMTP NOT CONFIGURED: ${!user ? 'ZOHO_SMTP_USER' : ''}${!user && !pass ? ' and ' : ''}${!pass ? 'ZOHO_SMTP_PASS' : ''} missing from this environment.`)
  process.exit(2)
}

// Same host, port and TLS mode as scripts/lib/notify.mjs. Kept in step by hand;
// if that file moves off smtp.zoho.com.au:465, this one has to as well or it
// will be verifying a server nobody sends through.
const transport = nodemailer.createTransport({
  host: 'smtp.zoho.com.au', port: 465, secure: true,
  auth: { user, pass },
  connectionTimeout: 15_000,
})

console.log(`Verifying SMTP login as ${maskEmail(user)} against smtp.zoho.com.au:465 …`)
try {
  await transport.verify()
  console.log('AUTH OK — the newsletter and bill-alert scripts can send.')
  process.exit(0)
} catch (e) {
  // The first line of Zoho's rejection names the cause (bad password, account
  // locked, address not permitted); the rest is a stack that adds nothing.
  console.error(`AUTH FAILED: ${String(e?.message || e).split('\n')[0]}`)
  console.error('Check ZOHO_SMTP_USER matches the mailbox address in Zoho, and that the app password is still valid.')
  process.exit(1)
}
