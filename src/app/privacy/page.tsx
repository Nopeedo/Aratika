import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
// Read from SITE rather than typing the address in. In September 2026 three
// hardcoded copies of an old address (hello@ on a domain that had no MX record
// at all) survived here after SITE.email had moved on, so every one of those
// links pointed at a mailbox that cannot receive mail. This page is
// where the Privacy Act access, correction and deletion requests are supposed
// to arrive, so they were bouncing.
import { SITE } from '@/constants/site'

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
 * Stripe returned on 29 Sep 2026, for donations rather than subscriptions.
 * Politika is the merchant on its own account, Checkout is hosted on Stripe’s
 * own page, and a donation is the first thing this site collects from someone
 * who may have no account at all. That is what "If you donate" is for.
 *
 * If a feature changes, this page changes with it. Anything listed here should
 * be traceable to code on the day it is published.
 */

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Politika collects, what stays on your device, and who else your browser talks to, under the New Zealand Privacy Act 2020.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="What we collect, what never leaves your device, and who else sees anything."
      updated="October 2026"
    >
      <h2>Who we are</h2>
      <p>
        Politika is an independent, non-partisan platform that helps New Zealanders understand Parliament, MPs, parties,
        policies and elections. We are not affiliated with the Government or any political party. This policy explains
        how we handle personal information under the <strong>Privacy Act 2020</strong>. Politika isn’t a registered
        company or a charity: it is built and run by one person, {SITE.promoter.name}, who is responsible for the
        information described here and who a donation is paid to. You can reach us any time at{' '}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or through the <a href="/contact">contact page</a>.
      </p>
      <p>
        <strong>Politika is free, and there is nothing to pay for.</strong> There is no paid tier and nothing is held
        back. You can donate if you want to, and nothing about the site changes whether you do or you don’t. Card
        details are typed on Stripe’s own page and never reach us.
      </p>

      <h2>You can use most of Politika without an account</h2>
      <p>
        Reading the site, parties, policies, MPs, bills, the map, the news feed, needs no account and no sign-in.
        Tracking things does need an account, so that we can tell you when they move. If you work through the Learn
        modules while signed out, that progress is saved <strong>in your own browser</strong> and never sent to us.
        See “What stays on your device” below.
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
        That is how your dashboard has them on your other devices, but it does mean choices you made while signed out
        become part of your account.
      </p>

      <h2>If you donate</h2>
      <p>
        Donating is optional and needs no account. <strong>Your card details never reach us.</strong> The donate
        button sends you to Stripe’s own page, on Stripe’s website, and the card number, expiry and security code
        are typed there. We never see them and they are never on our servers.
      </p>
      <p>
        What Stripe passes back, and what we keep, is the record of the donation: <strong>your name and email
        address</strong> as you gave them to Stripe, the amount, whether you covered the processing fee, whether you
        asked for email updates, a reference, and when it was paid. We keep it to send you a receipt, to answer you
        if you ask about your donation, and so money coming in can be accounted for. If your card needed a billing
        address, Stripe holds it; we don’t read it or store it.
      </p>
      <p>
        <strong>We don’t publish donor names and we don’t pass them to anyone.</strong> No party, campaign or
        candidate is told who gave, or that you gave at all.
      </p>
      <p>
        Two things worth naming. A donation shows up on your bank or card statement, so anyone who can see your
        statement can see it. And because we are the merchant, Stripe keeps its own customer record of your name and
        email on our account, as well as the record we keep.
      </p>
      <p>
        The <strong>email updates</strong> tick box is off unless you tick it. It records, with your donation, that
        you’d like them. Anything we send you afterwards has an unsubscribe link in it.
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
          once to say so, with the closing date and a link to have your say. Turning the email switch off stops these
          too, it’s one switch for everything we choose to send you, and the unsubscribe link in any of our emails does the same.
        </li>
        <li><strong>Account emails</strong>, confirming your address, or resetting your password.</li>
        <li>
          <strong>A receipt, if you donate.</strong> Sent once, to the address you gave Stripe. It isn’t a mailing
          list and the switch above doesn’t cover it: it’s the record of your donation.
        </li>
      </ul>
      <p>
        <strong>Email updates without an account.</strong> You can also join our mailing list without an account,
        through the email box on our pages. For that we store your email address, where on the site you signed up,
        and when. Every email we send has an unsubscribe link.
      </p>
      <p>
        We keep a record that an alert was sent to you, so we don’t send the same one twice. We don’t sell your address,
        we don’t share it for marketing, and we don’t send advertising.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Signed out, the site remembers things in your browser’s own storage. It never reaches our servers, and clearing
        your browser data removes it: the one thing you last tapped Track on before signing up (so it can be tracked
        for you once you are in), your Learn scores, which onboarding steps you’ve done,
        whether you’ve asked for jargon to be explained, your answers to the quick guide (including whether you said
        you’re enrolled), banners you’ve dismissed, and when you last looked at a particular MP’s page. Your browser
        also keeps two random codes for our visit counts (see “Cookies and measurement”); they identify a browser,
        not a person.
      </p>

      <h2>What we deliberately do not collect</h2>
      <ul>
        <li><strong>Your letters and submissions.</strong> The drafting tools run entirely in your browser. We never receive, store or send what you write, you copy it and send it yourself.</li>
        <li><strong>Card or bank details.</strong> Donations are typed on Stripe’s own page. We never see your card
        number and it is never on our servers.</li>
        <li><strong>Your location.</strong> We don’t ask your device for it. If you search an address on the map, that happens in your browser to find your electorate.</li>
        <li><strong>Sensitive information.</strong> We don’t ask for it and don’t want it. We never ask who you vote for, and the compass doesn’t record your answers to us.</li>
      </ul>

      <h2>Cookies and measurement</h2>
      <p>
        We use <strong>sign-in cookies</strong>, which keep you logged in and keep the sign-in process secure, and
        <strong>one cookie for the pledge counter</strong>, which records that this browser has already pledged so you
        aren’t counted twice. There are no advertising cookies and no third-party tracking cookies.
      </p>
      <p>
        We do measure how the site performs, page speed and how pages are used, through our host, Vercel. It’s
        cookieless and not tied to your account. One thing worth naming: if you finish the political compass, we record
        that it was finished, how many issues you engaged with, and the voting-frequency option you picked. <strong>Your
        actual answers, your issues and any party leaning are not sent</strong>, we only learn that the tool is being
        used and roughly by whom.
      </p>
      <p>
        We also <strong>count page visits ourselves</strong>, so we can see which pages are useful. Each visit records
        the page’s address (without anything after a “?”), a random code your browser keeps so we can count visitors
        rather than visits, a second random code that lasts one visit, whether you’re on a phone, tablet or computer,
        and, on the first page of a visit, the name of the site that linked you here. We don’t record your IP address
        when counting page visits, and none of this is tied to your account. Visits from search-engine robots aren’t counted.
      </p>

      <h2>If you pledge to vote</h2>
      <p>
        Pledging records one line: the time, your email, your name if you gave one, a random code kept in a cookie
        on your device so you aren’t counted twice, and your account if you’re signed in.
      </p>
      <p>
        The <strong>name is optional, the email isn’t</strong>. The email is how each person is counted once,
        because a cookie can be cleared and an address can’t be. We don’t send anything to it unless you tick the
        box asking us to. Nothing is recorded until you confirm, so opening the form and leaving it records nothing.
      </p>
      <p>
        <strong>Your name only appears publicly if you tick that box</strong>, and it shows as a first name and a
        surname initial, like “John D.”. Never your full name, never your email. Leave it unticked and you appear
        as “Anonymous”. Asking to be emailed is a separate box, and neither is ticked for you.
      </p>
      <p>
        We also store a <strong>scrambled one-way code made from your internet address</strong>. It exists only to stop
        automated scripts inflating the count, it is not your IP address, and it cannot be turned back into one.
      </p>
      <p>
        We don’t ask whether you’re enrolled, we just point you at vote.nz to check. We never learn whether you
        enrolled or actually voted. <strong>Nobody can</strong> &mdash; the Electoral Commission doesn’t share that,
        and it shouldn’t.
      </p>

      <h2>Who else your browser talks to</h2>
      <p>We keep this list short on purpose. When you use Politika, these are the others involved:</p>
      <ul>
        <li><strong>Supabase</strong>, stores accounts and everything above, and sends account emails.</li>
        <li><strong>Vercel</strong>, hosts the site, and provides the performance measurement described above.</li>
        <li><strong>Zoho Mail</strong>, carries the weekly email, bill alerts and donation receipts we send you.</li>
        <li><strong>Stripe</strong>, takes donations. Donating sends your browser to Stripe’s own page, so your card
        details and your IP address reach Stripe there rather than here. No Stripe code runs on Politika.</li>
        <li><strong>Esri</strong>, supplies the background imagery for the electorate map. Loading the map means Esri receives your IP address and which part of the country you’re looking at.</li>
        <li><strong>News publishers</strong>, article pictures on the news page load from RNZ, the Beehive, NZ Herald, Stuff and Newsroom directly, so those sites see your IP address when the page loads. The headlines link out to them too.</li>
        <li><strong>Your browser’s notification service</strong>, Google, Apple or Mozilla, depending on your browser, but only if you turn notifications on. The message itself is encrypted before it leaves us, though they can see that something was sent to your device.</li>
      </ul>
      <p>
        These are all overseas companies, mostly in the United States, with Zoho Mail in Australia, so your
        information is stored and handled outside New Zealand. We only use providers required to protect it to a
        standard comparable to New Zealand’s, and they hold it to provide their service to us rather than for
        their own purposes. Stripe is the exception: it also uses what you give it for its own payment and fraud
        checks, under its own privacy policy. We don’t otherwise disclose your information except where the law
        requires it.
      </p>

      <h2>Your rights</h2>
      <p>
        Under the Privacy Act 2020 you can ask to <strong>see</strong> or <strong>correct</strong> the personal
        information we hold about you, and you can ask us to <strong>delete your account and everything attached to
        it</strong>. Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or use the{' '}
        <a href="/contact">contact page</a> and we’ll do it. There is no self-service delete button yet, until there
        is, we do it by hand on request, which we’ll confirm to you when it’s done.
      </p>
      <p>
        <strong>If you donated</strong>, that isn’t attached to an account, so closing an account doesn’t reach it.
        Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> with the reference from your receipt and we can tell
        you what we hold, correct it, or take your name and email off both our record and the customer record Stripe
        keeps on our account. The payment itself stays on Stripe’s books under its own rules, the way a bank keeps
        a transaction.
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
      <p>
        <strong>Donation records are different.</strong> They aren’t attached to an account, and we haven’t set a
        time limit on them. We’d rather say that plainly than name a period nothing enforces. Ask us and we’ll take
        your name and email off the record.
      </p>

      <h2>Children</h2>
      <p>
        Our Learn content includes a Kids tier. It needs no account and collects nothing. Accounts are meant for adults,
        and we don’t knowingly collect personal information from children.
      </p>

      <h2>Information about MPs, candidates and parties</h2>
      <p>
        What we publish about MPs, candidates and parties comes from official public records, Parliament, the Electoral
        Commission, Stats NZ, and their own published material, and relates to their public roles. Contact details we
        show for MPs are the ones Parliament publishes. We don’t publish private details such as home addresses.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We’ll update this policy as the site changes, and change the date above when we do. Questions, corrections or a
        request about your information: <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or the{' '}
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  )
}
