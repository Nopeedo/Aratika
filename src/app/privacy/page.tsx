import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

/**
 * The privacy policy is written from an audit of what the code ACTUALLY does —
 * every table, every cookie, every request a visitor's browser makes to someone
 * else's server — not from what the product was once planned to do.
 *
 * The version this replaces described a paid subscription processed by Stripe,
 * which no longer happens, and said nothing about the notifications, emails,
 * saved highlights or map tiles that shipped after it was written. A policy
 * that claims practices the site does not have is the failure mode that matters
 * most here, and it had drifted in both directions at once.
 *
 * If a feature changes, this page changes with it. Anything listed here should
 * be traceable to code on the day it is published.
 */

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Arapono collects, what stays on your device, and who else your browser talks to — under the New Zealand Privacy Act 2020.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="What we collect, what never leaves your device, and who else sees anything."
      updated="September 2026"
    >
      <h2>Who we are</h2>
      <p>
        Arapono is an independent, non-partisan platform that helps New Zealanders understand Parliament, MPs, parties,
        policies and elections. We are not affiliated with the Government or any political party. This policy explains
        how we handle personal information under the <strong>Privacy Act 2020</strong>. You can reach us any time at{' '}
        <a href="mailto:hello@arapono.nz">hello@arapono.nz</a> or through the <a href="/contact">contact page</a>.
      </p>
      <p>
        <strong>Arapono is free, and there is nothing to pay for.</strong> We don’t take payments, we don’t have a paid
        tier, and we don’t ask for card details anywhere on the site.
      </p>

      <h2>You can use most of Arapono without an account</h2>
      <p>
        Reading the site — parties, policies, MPs, bills, the map, the news feed — needs no account and no sign-in. If
        you follow things or work through the Learn modules while signed out, that is saved <strong>in your own
        browser</strong> and never sent to us. See “What stays on your device” below.
      </p>

      <h2>What we collect if you create an account</h2>
      <ul>
        <li><strong>Your email address and your name.</strong> Both are required to sign up. Your name is used to greet you on your dashboard.</li>
        <li><strong>The things you follow.</strong> When you track an MP, party, electorate, policy topic, bill or electorate race, we save what it is, its name and the link, so we can show it on your dashboard and tell you when it moves.</li>
        <li><strong>Your Learn progress and quiz results</strong>, so the site can show you where you got to.</li>
        <li><strong>Highlights and notes you make on bills</strong>, so they’re there when you come back.</li>
        <li><strong>Your notification settings</strong>, and a private unsubscribe code that lets the “unsubscribe” link in our emails work without making you log in.</li>
        <li><strong>Your devices, only if you turn on notifications.</strong> To send a browser notification we have to store the address your browser gives us for it, the keys that encrypt the message, and which browser it is. Nothing is stored until you say yes to your browser’s permission prompt.</li>
      </ul>
      <p>
        <strong>Signing in uploads what was in your browser.</strong> If you followed things or did Learn modules before
        making an account, they are copied to your account the first time you sign in, and cleared from your browser.
        That is how your dashboard has them on your other devices — but it does mean choices you made while signed out
        become part of your account.
      </p>

      <h2>Emails we send you</h2>
      <ul>
        <li>
          <strong>The weekly email is on by default.</strong> When you create an account you’re signed up to a weekly
          round-up, which includes updates on the things you follow. Every one has a one-click unsubscribe link that
          works without logging in, and there’s a switch in <a href="/settings">Settings</a>. We think you should know
          it starts on rather than off.
        </li>
        <li>
          <strong>Alerts about bills you follow.</strong> If a bill you track opens for public submissions, we email you
          once to say so, with the closing date. <strong>Turning off the weekly email does not currently stop these</strong>
          — they’re a separate alert, and we’re fixing that so one switch covers both. Until then, tell us at{' '}
          <a href="mailto:hello@arapono.nz">hello@arapono.nz</a> and we’ll stop them for you.
        </li>
        <li><strong>Account emails</strong> — confirming your address, or resetting your password.</li>
      </ul>
      <p>
        We keep a record that an alert was sent to you, so we don’t send the same one twice. We don’t sell your address,
        we don’t share it for marketing, and we don’t send advertising.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Signed out, the site remembers things in your browser’s own storage. It never reaches our servers, and clearing
        your browser data removes it: the things you’ve followed, your Learn scores, which onboarding steps you’ve done,
        whether you’ve asked for jargon to be explained, your answers to the quick guide (including whether you said
        you’re enrolled), banners you’ve dismissed, and when you last looked at a particular MP’s page.
      </p>

      <h2>What we deliberately do not collect</h2>
      <ul>
        <li><strong>Your letters and submissions.</strong> The drafting tools run entirely in your browser. We never receive, store or send what you write — you copy it and send it yourself.</li>
        <li><strong>Card or bank details.</strong> There is nothing to pay for, so we never ask.</li>
        <li><strong>Your location.</strong> We don’t ask your device for it. If you search an address on the map, that happens in your browser to find your electorate.</li>
        <li><strong>Sensitive information.</strong> We don’t ask for it and don’t want it. We never ask who you vote for, and the compass doesn’t record your answers to us.</li>
      </ul>

      <h2>Cookies and measurement</h2>
      <p>
        We use <strong>sign-in cookies only</strong> — they keep you logged in and keep the sign-in process secure.
        There are no advertising cookies and no third-party tracking cookies.
      </p>
      <p>
        We do measure how the site performs — page speed and how pages are used — through our host, Vercel. It’s
        cookieless and not tied to your account. One thing worth naming: if you finish the political compass, we record
        that it was finished, how many issues you engaged with, and the voting-frequency option you picked. <strong>Your
        actual answers, your issues and any party leaning are not sent</strong> — we only learn that the tool is being
        used and roughly by whom.
      </p>

      <h2>Who else your browser talks to</h2>
      <p>We keep this list short on purpose. When you use Arapono, these are the others involved:</p>
      <ul>
        <li><strong>Supabase</strong> — stores accounts and everything above, and sends account emails.</li>
        <li><strong>Vercel</strong> — hosts the site, and provides the performance measurement described above.</li>
        <li><strong>Zoho Mail</strong> — carries the weekly email and bill alerts we send you.</li>
        <li><strong>Esri</strong> — supplies the background imagery for the electorate map. Loading the map means Esri receives your IP address and which part of the country you’re looking at.</li>
        <li><strong>News publishers</strong> — article pictures on the news page load from RNZ, the Beehive, NZ Herald, Stuff and Newsroom directly, so those sites see your IP address when the page loads. The headlines link out to them too.</li>
        <li><strong>Your browser’s notification service</strong> — Google, Apple or Mozilla, depending on your browser, but only if you turn notifications on. The message itself is encrypted before it leaves us, though they can see that something was sent to your device.</li>
      </ul>
      <p>
        Each handles data under its own obligations. We don’t otherwise disclose your information except where the law
        requires it.
      </p>

      <h2>Your rights</h2>
      <p>
        Under the Privacy Act 2020 you can ask to <strong>see</strong> or <strong>correct</strong> the personal
        information we hold about you, and you can ask us to <strong>delete your account and everything attached to
        it</strong>. Email <a href="mailto:hello@arapono.nz">hello@arapono.nz</a> or use the{' '}
        <a href="/contact">contact page</a> and we’ll do it. There is no self-service delete button yet — until there
        is, we do it by hand on request, which we’ll confirm to you when it’s done.
      </p>
      <p>
        If you’re not satisfied with how we respond, you can raise it with the Office of the Privacy Commissioner
        (<a href="https://www.privacy.org.nz" target="_blank" rel="noopener noreferrer">privacy.org.nz</a>).
      </p>

      <h2>Security and how long we keep things</h2>
      <p>
        We keep your information for as long as you have an account, and delete it when you ask us to. We take
        reasonable steps to protect it: everything tied to an account is locked to that account at the database level,
        so one person’s saved items can’t be read by another. If a notifiable privacy breach happens we’ll act in line
        with the Privacy Act, including telling the Privacy Commissioner and the people affected where required.
      </p>

      <h2>Children</h2>
      <p>
        Our Learn content includes a Kids tier. It needs no account and collects nothing. Accounts are meant for adults,
        and we don’t knowingly collect personal information from children.
      </p>

      <h2>Information about MPs, candidates and parties</h2>
      <p>
        What we publish about MPs, candidates and parties comes from official public records — Parliament, the Electoral
        Commission, Stats NZ — and their own published material, and relates to their public roles. Contact details we
        show for MPs are the ones Parliament publishes. We don’t publish private details such as home addresses.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We’ll update this policy as the site changes, and change the date above when we do. Questions, corrections or a
        request about your information: <a href="mailto:hello@arapono.nz">hello@arapono.nz</a> or the{' '}
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  )
}
