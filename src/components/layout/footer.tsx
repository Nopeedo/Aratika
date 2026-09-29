import * as React from 'react'
import Link from 'next/link'
import { ExternalLink, Heart } from 'lucide-react'
import { SITE } from '@/constants/site'
import { FOOTER_LINKS } from '@/constants/nav-links'
import { isEnabled } from '@/constants/features'
import { LogoMark } from '@/components/brand/logo-mark'

export function Footer() {
  return (
    <footer className="bg-white text-[#6b6157] mt-auto border-t border-[#e6e2da]">
      {/* White, by request (was brand navy), in the site's warm palette:
          INK #2A1206 for headings, SECONDARY #6b6157 for links, TERTIARY
          #9a9186 for small print, BORDER #e6e2da for rules. */}

      {/* The "Data sourced from:" strip was here, on every page: six logos in
          pills above the footer proper. Removed by request, and it costs
          nothing real — it was a badge rather than evidence. The sourcing that
          carries weight is per-claim and untouched: every policy position
          links to the party's own document, every bill to its page on
          Parliament, and /about#sources still lists all six in full (linked
          not from this footer: its Learn and Explore columns were removed
          earlier, so "Our Sources" is not linked from here. /about#sources is
          reachable from the About page and from in-page links only). */}

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">

          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-brand-jade select-none">
                <LogoMark size={20} reversed />
              </div>
              {/* Same split as the navbar. On white the brand jade reads
                  properly, so it's used here instead of the lighter jade the
                  dark footer needed. Literal text on purpose — see the
                  navbar note. */}
              <span className="font-semibold text-[#2A1206] text-lg">Poli<span style={{ color: '#1F8A4C' }}>tika</span></span>
            </div>
            <p className="text-xs text-[#6b6157] leading-relaxed">
              {SITE.tagline}
            </p>
            <p className="text-xs text-[#9a9186] mt-3 leading-relaxed">
              An independent, non-partisan political information platform for New Zealanders.
            </p>

            {/* Official accounts. Driven by SITE.socials, which also feeds the
                Organization schema — so this appears the moment a handle is added
                there and stays absent while the list is empty. */}
            {SITE.socials.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-4">
                {SITE.socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="me noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#faf8f4] hover:bg-[#f1ede6] border border-[#e6e2da] rounded-full text-xs text-[#6b6157] transition-colors"
                    >
                      {social.label}
                      <ExternalLink className="size-2.5 opacity-60" />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* Donate, by request: always shown, always to the site's own
                /donate page, where Onebyone processes the payment. */}
            {(
              <div className="mt-5">
                <Link
                  href="/donate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1F8A4C] hover:bg-[#18703d] text-white text-sm font-semibold transition-colors"
                >
                  <Heart className="size-4" /> Donate to Politika
                </Link>
              </div>
            )}
          </div>

          {/* The Learn and Explore columns are gone, by request. Their link
              lists stay in FOOTER_LINKS (nav-links.ts), unrendered. */}

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-[#2A1206] uppercase tracking-wider mb-3">
              Account
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.account.filter((l) => isEnabled(l.feature)).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6b6157] hover:text-[#2A1206] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-[#2A1206] uppercase tracking-wider mb-3">
              Legal
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.filter((l) => isEnabled(l.feature)).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6b6157] hover:text-[#2A1206] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Promoter statement (Electoral Act 1993 s204F) — rendered only when an
          address is configured, so an incomplete statement never goes public.
          Kept clearly legible (not tiny) per Electoral Commission guidance. */}
      {SITE.promoter.address && (
        <div className="border-t border-[#e6e2da]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-xs sm:text-[13px] text-[#6b6157] text-center">
              Promoted by {SITE.promoter.name}, {SITE.promoter.address}.
            </p>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="border-t border-[#e6e2da]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#9a9186]">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="text-xs text-[#9a9186] text-center sm:text-right max-w-md">
            Politika is an independent platform. All information is sourced from official NZ government
            and electoral sources. We are not affiliated with any political party.
          </p>
        </div>
      </div>
    </footer>
  )
}
