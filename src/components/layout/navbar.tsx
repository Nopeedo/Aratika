'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronDown, Map, User, LogOut, Settings, Crown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { NAV_LINKS } from '@/constants/nav-links'
import { SITE } from '@/constants/site'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

// ─── Aratika Logo ─────────────────────────────────────────────────────────────

function AratikaLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      {/* Icon mark — stylised A with NZ jade colour */}
      <div className="flex items-center justify-center size-8 rounded-lg bg-brand-navy text-brand-jade font-bold text-lg leading-none select-none">
        A
      </div>
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <AratikaLogo />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-brand-jade bg-brand-jade-subtle'
                    : 'text-muted hover:text-foreground hover:bg-surface',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {!isPremium && (
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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-brand-jade bg-brand-jade-subtle'
                    : 'text-foreground hover:bg-surface',
                )}
              >
                {link.label}
                <span className="ml-auto text-xs text-muted">{link.description}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Auth */}
          <div className="max-w-7xl mx-auto px-4 pb-4 pt-2 border-t border-border flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                {!isPremium && (
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
          {isPremium && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-amber-600 font-medium border-b border-border mb-1">
              <Crown className="size-3.5" />
              Premium Member
            </div>
          )}
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
