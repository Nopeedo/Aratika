# Notifications & Newsletter — Spec

How Arapono decides what to notify, and how urgently. Keep the bell trustworthy:
reserve **immediate** for deadlines, live election moments, and rare bill
milestones; batch everything else into a **daily digest**.

## Classification rule
- **Immediate** — time-sensitive (a deadline / live moment) OR a rare, singular
  milestone where the single event is the payoff. Low-frequency, high-signal.
- **Daily digest** — meaningful but not urgent, and/or higher-volume. One batched
  push + email per day per user: "3 updates on things you follow".
- **Scheduled** — fixed calendar dates (election timeline, submission deadlines).

Second axis: **personalised** (only trackers of that item) vs **broadcast** (all
opted-in accounts).

## A. Immediate push
| Event | Source | Scope |
|---|---|---|
| Tracked bill opens for public submissions | bills-54 `submissionsCalled` | personal |
| Tracked bill submission deadline in 48h | bills-54 `submissionsClose` | personal |
| Tracked bill passed into law (Royal Assent) | bills-54 status | personal |
| Tracked bill defeated / withdrawn (Terminated) | bills-54 status | personal |
| Enrolment deadline (3 days / last day) | EC calendar | broadcast |
| Advance voting opens | EC calendar | broadcast |
| Election day — polls open / "vote today" | fixed 7 Nov 2026 | broadcast |
| Election night: your electorate + national result | results feed | both |
| Government formed / coalition announced | editor/news | broadcast |
| Tracked MP resigns / by-election called | roster-drift check | personal |

## B. Daily digest
| Event | Source | Scope |
|---|---|---|
| Tracked bill advances a stage (readings, select committee) | bills-54 status diff | personal |
| News tagged to a tracked party / MP / policy | `content_items.data.parties/mps` | personal |
| Video tagged to a tracked party / MP | content_items | personal |
| New/updated party policy or position on a tracked party/issue | positions pipeline | personal |
| Tracked MP notable vote / written question | mp-activity | personal |
| New candidate confirmed in a tracked electorate | candidate ingest | personal |

## C. Scheduled reminders (broadcast, calendar-driven)
Election countdown nudges — 30 days, 1 week, "vote tomorrow", "polls open now" —
plus Budget day and EC-confirmed dates. Highest mission value (activating
non-voters).

## D. Weekly email newsletter (Phase 3, not push)
General editorial digest + per-user "your tracked items this week".

## E. Deliberately NOT notifications
Auth emails (already handled), minor content corrections, feature announcements
(in-app banner instead).

## Anti-fatigue guardrails
- Cap immediate pushes to ~2–3/day/user; overflow rolls into the evening digest.
- Quiet hours 9pm–8am NZ — hold pushes for the morning.
- Dedup — never notify the same event twice (unique `dedup_key` per user+event).
- Per-category opt-outs (later) so light and power users both stay comfortable.

## Implementation
- **Queue** (`notification_queue`, migration 0010): detection enqueues rows
  (`urgency`, `category`, `dedup_key`, title/body/url); a sender processes them.
  Decouples detect-from-send so guardrails live in one place.
- **Triggers:** `detect-bill-changes.mjs` (status diff vs `scripts/.state/bill-status.json`);
  content triggers off `content_items` × `bookmarks`; scheduled reminders off a
  dated calendar.
- **Send:** `send-notifications.mjs` — immediate mode (sends pending immediate,
  respecting quiet hours + cap) and digest mode (one batched push+email/user).
  Web Push via `web-push` + VAPID; email via Zoho SMTP (shared `scripts/lib/notify.mjs`).
- **Safety:** dry-run by default; real sends require `--send`. Never blast users
  without explicit sign-off.
