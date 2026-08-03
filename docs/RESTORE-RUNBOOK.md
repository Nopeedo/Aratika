# Restore runbook — Arapono

"We have backups" only counts once a restore has actually been tested. This is
the procedure. Do the **dry run** (section 3) once so it's proven, then again if
anything about the database changes.

## What is backed up, and where

| Layer | What | Where | Retention |
|---|---|---|---|
| **Primary** | The whole Supabase database (all tables, incl. user data) | Supabase's own daily backups + Point-in-Time Recovery | Per Supabase plan |
| **Secondary** | `content_items` (public content only — news, positions, legislation, video, candidates, polls) | `Backup content` GitHub Action → run artifact `content-backup-<id>` (gzipped JSON) | 90 days |
| **Audit trail** | Row counts + per-type breakdown + content hash | `backups/content_items.manifest.json` in the repo | Forever (git history) |

User tables (bookmarks, learn_progress, editors) are **only** in the Supabase
backup — they hold personal data and are never exported to the public repo.

## 1. Primary restore (the real one) — Supabase

For real data loss (accidental delete, bad migration), use Supabase, not the repo copy:

1. Supabase dashboard → your project → **Database → Backups**.
2. Choose **Point-in-Time Recovery** and pick a timestamp just before the incident,
   or restore the most recent daily backup.
3. Supabase restores in place. This covers **every** table, including user data.

PITR availability depends on the plan — confirm it's enabled (Database → Backups).
If it isn't, the daily backups are still there; enable PITR for tighter recovery.

## 2. Secondary restore — the repo/artifact snapshot

Use this if you need just the public content back (e.g. a bad bulk edit wiped
approved positions) and want a fast, targeted fix without a full DB restore.

1. GitHub → **Actions → Backup content** → open a recent run → download the
   `content-backup-<id>` artifact → unzip to `content_items.latest.json.gz`.
2. `gunzip content_items.latest.json.gz` → `content_items.latest.json`.
3. Restore with the helper (idempotent upsert on `id`):
   ```bash
   node scripts/restore-content.mjs ./content_items.latest.json          # dry run: prints what would change
   node scripts/restore-content.mjs ./content_items.latest.json --apply  # writes
   ```
   Full bill text is not in the snapshot (it's re-fetchable) — re-run
   `node scripts/enrich-bills.mjs --all` afterwards if a bill's full text is needed.

## 3. Dry-run test — DO THIS ONCE so the backups are proven

The point is to confirm a restore actually works before you ever need it:

1. Trigger a backup: Actions → **Backup content** → Run workflow. Download the artifact.
2. `gunzip` it, then run **the dry run only**:
   `node scripts/restore-content.mjs ./content_items.latest.json`
3. It should report something like *"2085 rows in snapshot · N would update · 0 errors"*
   with **0 unresolved differences against the live table** (a fresh backup should
   match live exactly). If it does, the snapshot is valid and restorable. ✅
4. Record the date you did this at the bottom of this file.

You do **not** need to run `--apply` for the test — a clean dry run against a
fresh snapshot is proof enough. Only `--apply` during a genuine restore.

## 4. If the whole Supabase project is lost

1. Create a new Supabase project.
2. Re-run the migrations in `supabase/migrations/` to recreate the schema + RLS.
3. Set the env vars (Vercel + `.env.local` + GitHub secrets) to the new project.
4. Restore content with section 2; user data would be gone unless exported from
   the old project's backup first — which is why the Supabase-level backup (1) is
   primary and this repo copy is only belt-and-braces for public content.

---

_Last verified restore (dry run passed): __________  by: ___________
