# Design Handoff — Homepage simplification (Aug 2026)

Portable context so another Claude Code session can continue the recent design
work. Covers commits `eb71dc5` … `b79855d`. (Full chat transcripts are local
per-machine and don't transfer — this doc is the hand-off.)

## Setup (first run on a new machine)
Cloning gets the source, but two things are kept out of git on purpose
(`node_modules` and secrets), so you need a few steps beyond `git clone`:

1. **Install Node.js** — v20 or newer (the project was built on v24). Includes
   `npm`.
2. **Clone + install dependencies** (rebuilds the gitignored `node_modules`):
   ```bash
   git clone https://github.com/Nopeedo/Aratika.git
   cd Aratika
   npm install
   ```
3. **Create `.env.local`** — copy the template and fill in the real values:
   ```bash
   cp .env.example .env.local
   ```
   `.env.local` is **gitignored** (the repo is public — secrets must never be
   committed), so the actual values have to be shared **out-of-band** (a
   password manager or an encrypted message — never via GitHub or plain email).
   The keys that matter most:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — so live
     content (party positions, news) loads.
   - `SUPABASE_SERVICE_ROLE_KEY` — for the editor / write features.
   - Stripe, Anthropic, and Sentry keys are optional for most design work.
4. **Run it:**
   ```bash
   npm run dev
   ```
   Opens on `http://localhost:3000`.

**Design work needs almost none of this:** even with an empty `.env.local`,
`npm install && npm run dev` renders the full layout, hero, tiles, carousel and
styling. Only the *data* stays empty until the Supabase keys are in place — so
you can start on design immediately.

If you're developing with **Claude Code**, install and sign in separately; this
handoff auto-loads via `CLAUDE.md`, so a fresh session already has this context.

## The problem we were solving
Real users — especially people who don't usually vote — said the site showed
too much at once. The homepage was ~12 stacked sections (~13 phone-screens) and
the nav had ~13 destinations. Goal: shrink to the core purpose and give
non-voters a guided way in without overwhelming them.

## Design principles (please keep)
- **Default to less.** A first-timer should grasp what the site is and see one
  obvious next step in under ~60s / 2 taps.
- **Demote, don't delete.** Unused sections/components stay in the repo, just
  not stacked on the homepage.
- **Non-partisan.** Point, never declare a "winner." Neutral accents (the
  cycling party colour, not a fixed one — a fixed colour reads as favouring a
  party).
- **Feature-gate by launch phase** (`src/constants/features.ts`) — never link to
  a route that's hidden in the current phase.

## What changed (by area)
1. **Guided on-ramp** — `/guide` (`src/components/guide/quick-guide.tsx`,
   `src/app/guide/page.tsx`): skippable 3-question flow (issues → enrol
   readiness → depth) ending in concrete next steps. The deeper 12-question
   compass stays at `/start`.
2. **Hero choice** — `src/components/homepage/cinematic-hero-burnt.tsx` is the
   LIVE hero (imported by `page.tsx` as `CinematicHero`; its docstring calling
   it a "theme preview" is stale). Two actions: **Help me get started** →
   `/guide`; **I'll look around myself** → `#parties`.
3. **Lean homepage** — `src/app/page.tsx`: hero → `PartyTilesSection` →
   `PolicyHubGrid` → `HomeMap` → `CredibilityStrip` → `ExploreCarousel`.
   ~13 → ~6 phone-screens.
4. **Explore carousel** — `src/components/homepage/explore-carousel.tsx`:
   horizontal, feature-gated cards linking to every demoted feature. Full-bleed
   rail; the `GUTTER` const keeps the first card aligned to the header while
   cards scroll off the true viewport edge.
5. **Full-page weave** — `.bg-weave` (see `src/app/globals.css`) sits on the
   page wrapper in `page.tsx`; light sections set `background:'transparent'` so
   one continuous texture shows through. Dark bands stay opaque as contrast.

## Gotchas that bit us
- **Sticky party tiles** (`src/components/homepage/party-tiles.tsx`) are
  DESIGNED to "ride the whole page" (pinned at `top:64`) so you can pick a party
  while scrolling and the policy grid reacts. Do **not** wrap
  `<PartyTilesSection/>` in a bounding `<div>` — that div becomes the sticky
  element's containing block and un-sticks the tiles early. The `#parties`
  anchor is deliberately a separate zero-height marker for this reason.
- The **tiles ↔ policy grid** link is the shared `usePartyCycle()` context
  (`selectedSlug`); `PolicyExplorer` reads it to show "Focused on {party}".
- `next dev` does **not** type-check. Run `npx tsc --noEmit` before assuming a
  change is safe — the Vercel prod build type-checks and will fail on errors
  dev never surfaced.
- Local `.next/types` can hold stale route types after deleting a page:
  `rm -rf .next/types .next/dev/types` then re-run tsc.

## How to run / verify
- Dev server: `npm run dev` (Next.js 16, webpack).
- Type-check: `npx tsc --noEmit`.
- The repo is **public** — never commit secrets or the gitignored working docs
  (`docs/*.docx`).

## Open design decisions
- Whether to pull ONE hero feature (e.g. a one-line "state of the race" bar)
  back onto the homepage for engaged/returning users.
- Party logos in the tiles: currently colour + name only (copyright caution) —
  revisit only with permission or a neutral non-official mark.
- Whether to condense any of the three core sections further.
