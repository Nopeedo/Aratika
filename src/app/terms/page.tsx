import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms for using Aratika — an independent, non-partisan New Zealand political information platform.',
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      subtitle="The ground rules for using Aratika."
      updated="June 2026"
    >
      <h2>1. About Aratika</h2>
      <p>
        Aratika is an <strong>independent, non-partisan</strong> information platform about New Zealand politics. We are
        <strong> not affiliated with the Government, Parliament, the Electoral Commission, or any political party</strong>.
        By using the site you agree to these terms.
      </p>

      <h2>2. Information, not advice</h2>
      <p>
        Aratika provides general information for civic understanding. It is <strong>not legal, financial, or electoral
        advice</strong>, and nothing here tells you how to vote. We draw on official sources and work hard to be accurate,
        but we don’t guarantee the information is complete or error-free — for anything you rely on, check the original
        official source. If you spot a mistake, please tell us via the <a href="/contact">correction page</a>.
      </p>

      <h2>3. Non-partisan commitment</h2>
      <p>We present parties, MPs and policies even-handedly and do not endorse or oppose any party or candidate. Where we describe positions, we attribute them to their source.</p>

      <h2>4. Acceptable use</h2>
      <p>You agree to use Aratika lawfully and respectfully. You must not:</p>
      <ul>
        <li>use the platform, or any information on it, to <strong>harass, threaten, or abuse</strong> any MP, candidate, official or other person;</li>
        <li>use the Take Action tools to send abusive, misleading, or unlawful content;</li>
        <li>misrepresent yourself, or impersonate anyone;</li>
        <li>scrape, copy, or republish the site at scale, or disrupt its operation.</li>
      </ul>

      <h2>5. The Take Action studio</h2>
      <p>
        Our drafting tools help you write letters and submissions in <strong>your own words</strong>. Aratika does not send
        anything on your behalf and does not store what you draft — you review it and send it through official channels
        yourself. <strong>You are responsible for the content you send</strong> and for using the correct, current official
        contact details and deadlines.
      </p>

      <h2>6. Accounts</h2>
      <p>You’re responsible for keeping your login secure and for activity under your account. Tell us promptly if you suspect unauthorised use.</p>

      <h2>7. Premium subscriptions</h2>
      <ul>
        <li>Premium is a recurring subscription billed through <strong>Stripe</strong>.</li>
        <li>You can <strong>cancel anytime</strong> from your dashboard; access continues until the end of the paid period.</li>
        <li>Prices may change with reasonable notice; changes won’t affect the period you’ve already paid for.</li>
        <li>Your rights under the <strong>Consumer Guarantees Act 1993</strong> are not affected by these terms.</li>
      </ul>

      <h2>8. Intellectual property &amp; sources</h2>
      <p>
        Aratika’s own content, design and code belong to us. Underlying data comes from official sources — including the
        New Zealand Parliament, the Electoral Commission, and Stats NZ — and remains subject to their respective licences;
        we attribute these where used. MP photographs are used under their stated licences with attribution.
      </p>

      <h2>9. Liability</h2>
      <p>
        To the extent permitted by law, Aratika is provided “as is”, and we’re not liable for loss arising from reliance on
        the information or from interruptions to the service. Nothing in these terms limits rights you have under New Zealand
        consumer law that cannot be excluded.
      </p>

      <h2>10. Changes</h2>
      <p>We may update these terms as the platform develops; the “last updated” date above will change. Continued use means you accept the current terms.</p>

      <h2>11. Governing law</h2>
      <p>These terms are governed by the laws of New Zealand.</p>

      <h2>12. Contact</h2>
      <p>Questions about these terms? Reach us via the <a href="/contact">contact page</a>.</p>
    </LegalPage>
  )
}
