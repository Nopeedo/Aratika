'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronDown, Map, User, LogOut, Settings, Crown, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { visibleNav, type NavItem } from '@/constants/nav-links'
import { PREMIUM_ENABLED } from '@/constants/features'
import { SITE } from '@/constants/site'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { ExplainToggle } from '@/components/glossary/explain-toggle'
import { LogoMark } from '@/components/brand/logo-mark'

const NAV = visibleNav()
const cleanHref = (href: string) => href.split('#')[0]

// ─── Arapono Logo ─────────────────────────────────────────────────────────────

function AraponoLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={`${SITE.name} — home`}>
      <span className="flex items-center justify-center size-8 rounded-lg bg-brand-jade shrink-0">
        <LogoMark size={19} reversed />
      </span>
      <span className="font-semibold text-lg text-foreground tracking-tight">
        {SITE.name}
      </span>
    </Link>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Live auth state from Supabase
  const { user, isPremium } = useUser()
  const isLoggedIn = !!user

  const isActive = (href?: string) => {
    if (!href) return false
    const h = cleanHref(href)
    return pathname === h || (h !== '/' && pathname.startsWith(h + '/'))
  }
  const groupActive = (item: NavItem) =>
    item.children ? item.children.some((c) => isActive(c.href)) : isActive(item.href)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <AraponoLogo />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV.map((item) =>
              item.children ? (
                <DesktopGroup key={item.label} item={item} active={groupActive(item)} isActive={isActive} />
              ) : item.highlight ? (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'px-3 py-2 mr-1 rounded-md text-sm font-semibold transition-colors inline-flex items-center gap-1.5',
                    isActive(item.href)
                      ? 'bg-brand-jade-dark text-white'
                      : 'bg-brand-jade text-white hover:bg-brand-jade-dark',
                  )}
                >
                  <span className="size-1.5 rounded-full bg-white/90" aria-hidden="true" />
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'text-brand-jade bg-brand-jade-subtle'
                      : 'text-muted hover:text-foreground hover:bg-surface',
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* Desktop Auth Actions.
              "Explain terms" was removed from this desktop row to reduce header
              density; it remains in the mobile menu (below). Re-add <ExplainToggle />
              here to restore it. */}
          <div className="hidden lg:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {PREMIUM_ENABLED && !isPremium && (
                  <Button variant="premium" size="sm" asChild>
                    <Link href="/subscription">
                      <Crown className="size-3.5" />
                      Upgrade
                    </Link>
                  </Button>
                )}
                <UserMenu isPremium={isPremium} />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/register">Sign up free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden flex items-center justify-center size-9 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV.map((item) =>
              item.children ? (
                <MobileGroup key={item.label} item={item} isActive={isActive} />
              ) : item.highlight ? (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors',
                    isActive(item.href) ? 'bg-brand-jade-dark text-white' : 'bg-brand-jade text-white hover:bg-brand-jade-dark',
                  )}
                >
                  <span className="size-1.5 rounded-full bg-white/90" aria-hidden="true" />
                  {item.label}
                  <span className="ml-auto text-xs text-white/70">{item.description}</span>
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'text-brand-jade bg-brand-jade-subtle'
                      : 'text-foreground hover:bg-surface',
                  )}
                >
                  {item.label}
                  <span className="ml-auto text-xs text-muted">{item.description}</span>
                </Link>
              ),
            )}
          </nav>

          {/* Mobile: explain-terms toggle */}
          <div className="max-w-7xl mx-auto px-4 pb-2 pt-1">
            <ExplainToggle className="w-full justify-start" />
          </div>

          {/* Mobile Auth */}
          <div className="max-w-7xl mx-auto px-4 pb-4 pt-2 border-t border-border flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                {PREMIUM_ENABLED && !isPremium && (
                  <Button variant="premium" asChild>
                    <Link href="/subscription">
                      <Crown className="size-4" />
                      Upgrade to Premium — $20/month
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href="/dashboard">My Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" asChild>
                  <Link href="/register">Sign up free</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

// ─── Desktop dropdown group ───────────────────────────────────────────────────

function DesktopGroup({
  item,
  active,
  isActive,
}: {
  item: NavItem
  active: boolean
  isActive: (href?: string) => boolean
}) {
  const [open, setOpen] = React.useState(false)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          active
            ? 'text-brand-jade bg-brand-jade-subtle'
            : 'text-muted hover:text-foreground hover:bg-surface',
        )}
      >
        {item.label}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-64 bg-surface-raised rounded-xl border border-border shadow-lg py-1.5 z-50">
          {item.children!.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex flex-col gap-0.5 px-3 py-2 transition-colors',
                isActive(c.href) ? 'bg-brand-jade-subtle' : 'hover:bg-surface',
              )}
            >
              <span className={cn('text-sm font-medium', isActive(c.href) ? 'text-brand-jade' : 'text-foreground')}>
                {c.label}
              </span>
              <span className="text-xs text-muted leading-snug">{c.description}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mobile accordion group ───────────────────────────────────────────────────

function MobileGroup({
  item,
  isActive,
}: {
  item: NavItem
  isActive: (href?: string) => boolean
}) {
  const [open, setOpen] = React.useState(true)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-semibold text-foreground hover:bg-surface transition-colors"
      >
        {item.label}
        <ChevronDown className={cn('ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-3 border-l border-border pl-2 flex flex-col">
          {item.children!.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm transition-colors',
                isActive(c.href)
                  ? 'text-brand-jade bg-brand-jade-subtle font-medium'
                  : 'text-foreground hover:bg-surface',
              )}
            >
              {c.label}
              <span className="ml-auto text-xs text-muted">{c.description}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── User Menu (authenticated state) ─────────────────────────────────────────

function UserMenu({ isPremium }: { isPremium: boolean }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  async function handleSignOut() {
    setOpen(false)
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Close on outside click
  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
      >
        <User className="size-4" />
        Account
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-surface-raised rounded-xl border border-border shadow-lg py-1 z-50">
          {PREMIUM_ENABLED && isPremium && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-amber-600 font-medium border-b border-border mb-1">
              <Crown className="size-3.5" />
              Premium Member
            </div>
          )}
          <Link
            href="/plan"
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
            onClick={() => setOpen(false)}
          >
            <ListChecks className="size-4 text-muted" />
            Your Plan
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
            onClick={() => setOpen(false)}
          >
            <Map className="size-4 text-muted" />
            My Dashboard
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4 text-muted" />
            Account Settings
          </Link>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
