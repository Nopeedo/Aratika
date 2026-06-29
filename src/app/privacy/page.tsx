import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Aratika handles your personal information, under the New Zealand Privacy Act 2020.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How we handle your information — and the things we deliberately don't collect."
      updated="June 2026"
    >
      <h2>Who we are</h2>
      <p>
        Aratika is an independent, non-partisan platform that helps New Zealanders understand Parliament, MPs, parties,
        policies and elections. We are not affiliated with the Government or any political party. This policy explains how
        we handle personal information under the <strong>Privacy Act 2020</strong>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details</strong> — your email address and (optionally) your name, when you create an account.</li>
        <li><strong>Subscription status</strong> — whether you hold an active Premium subscription (managed through Stripe).</li>
        <li><strong>Learning progress</strong> — which Learn modules you’ve completed, so we can show your progress. For signed-out users this stays in your browser; for signed-in users it’s saved to your account.</li>
        <li><strong>Basic technical data</strong> — standard server and security logs needed to run the site reliably.</li>
      </ul>

      <h2>What we deliberately do not collect</h2>
      <ul>
        <li><strong>Your letters and submissions.</strong> The Take Action studio works entirely in your browser. We never receive, store, or send the content of anything you draft.</li>
        <li><strong>Your card details.</strong> Payments are processed by Stripe. Your card number never touches Aratika’s servers.</li>
        <li><strong>Sensitive information.</strong> We don’t ask for it and don’t want it.</li>
      </ul>

      <h2>How we use your information</h2>
      <p>Only to provide the service: to sign you in, give Premium members access to paid features, save your learning progress, process subscriptions, keep the platform secure, and respond when you contact us. We do not sell your information, and we don’t use it for advertising.</p>

      <h2>Who we share it with</h2>
      <p>We use trusted service providers who process data on our behalf:</p>
      <ul>
        <li><strong>Supabase</strong> — accounts and database.</li>
        <li><strong>Stripe</strong> — subscription payments.</li>
        <li><strong>Vercel</strong> — website hosting.</li>
      </ul>
      <p>Each handles your data under its own privacy and security obligations. We don’t otherwise disclose your information except where required by law.</p>

      <h2>Cookies</h2>
      <p>We use essential cookies to keep you signed in and the site secure. We don’t use advertising or third-party tracking cookies.</p>

      <h2>Your rights</h2>
      <p>Under the Privacy Act 2020 you can ask to <strong>access</strong> or <strong>correct</strong> the personal information we hold about you, and you can delete your account at any time. Contact us via the <a href="/contact">contact page</a>. If you’re not satisfied with our response, you can raise it with the Office of the Privacy Commissioner (<a href="https://www.privacy.org.nz" target="_blank" rel="noopener noreferrer">privacy.org.nz</a>).</p>

      <h2>Security &amp; retention</h2>
      <p>We take reasonable steps to protect your information and keep it only as long as needed to provide the service or meet legal obligations. If a notifiable privacy breach occurs, we’ll act in line with the Privacy Act, including notifying the Privacy Commissioner and affected people where required.</p>

      <h2>Children</h2>
      <p>Our Learn content includes a Kids tier, but it requires no account and collects no personal information. Accounts are intended for adults; we don’t knowingly collect personal information from children.</p>

      <h2>Information about MPs and public figures</h2>
      <p>Information we publish about MPs, candidates and parties is drawn from official public records (such as Parliament and the Electoral Commission) and relates to their public roles. We do not publish private personal details such as home addresses.</p>

      <h2>Changes &amp; contact</h2>
      <p>We may update this policy as the platform evolves; we’ll change the “last updated” date above. Questions? Reach us via the <a href="/contact">contact page</a>.</p>
    </LegalPage>
  )
}
