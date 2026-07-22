import * as React from 'react'
import Link from 'next/link'
import { ShieldCheck, ExternalLink } from 'lucide-react'
import { SITE, DATA_SOURCES } from '@/constants/site'
import { FOOTER_LINKS } from '@/constants/nav-links'
import { isEnabled } from '@/constants/features'
import { LogoMark } from '@/components/brand/logo-mark'

export function Footer() {
  return (
    <footer className="bg-brand-navy text-slate-300 mt-auto">

      {/* Source Credibility Bar */}
      <div className="border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-2">
              <ShieldCheck className="size-3.5 text-brand-jade shrink-0" />
              Data sourced from:
            </div>
            {DATA_SOURCES.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-xs text-slate-300 transition-colors"
              >
                {source.name}
                <ExternalLink className="size-2.5 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-brand-jade select-none">
                <LogoMark size={20} reversed />
              </div>
              <span className="font-semibold text-white text-lg">{SITE.name}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {SITE.tagline}
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              An independent, non-partisan political information platform for New Zealanders.
            </p>
          </div>

          {/* Learn */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Learn
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.learn.filter((l) => isEnabled(l.feature)).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.explore.filter((l) => isEnabled(l.feature)).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Account
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.account.filter((l) => isEnabled(l.feature)).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Legal
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.filter((l) => isEnabled(l.feature)).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
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
        <div className="border-t border-slate-700/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-xs sm:text-[13px] text-slate-400 text-center">
              Promoted by {SITE.promoter.name}, {SITE.promoter.address}.
            </p>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="border-t border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 text-center sm:text-right max-w-md">
            Arapono is an independent platform. All information is sourced from official NZ government
            and electoral sources. We are not affiliated with any political party.
          </p>
        </div>
      </div>
    </footer>
  )
}
