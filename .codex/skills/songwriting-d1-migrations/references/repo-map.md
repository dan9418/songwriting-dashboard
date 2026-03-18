# Repo Map

Use this file to rebuild context quickly before planning or implementing a D1 migration in this repo.

## Schema Sources

- `scripts/sql/init.sql`
  Canonical schema for a fresh database.
- `scripts/sql/migrations/*.sql`
  Ordered migration history used by Wrangler.
- `wrangler.jsonc`
  D1 binding and migration directory configuration. This repo uses `scripts/sql/migrations`.

## App and Script Touchpoints

- `src/lib/cloudflare/d1.ts`
  Raw D1 query helper used throughout the app.
- `src/lib/cloudflare/admin.ts`
  Admin console schema/table inspection helpers.
- `src/lib/cloudflare/catalog.ts`
- `src/lib/cloudflare/tracks.ts`
- `src/lib/cloudflare/audio-sync.ts`
- `src/lib/cloudflare/entities.ts`
  Shared query modules that often need updates after schema changes.
- `src/app/api/**/*.ts`
  Route handlers contain many direct SQL statements against D1.
- `scripts/seed-d1.js`
  Generates and optionally executes test seed SQL against D1.
- `scripts/sql/seed.sql`
  Seed output that can become stale after schema changes.
- `scripts/sql/import_music_data.sql`
  Import SQL that may need column or table updates.
- `scripts/backfill-audio-from-r2.js`
  Reconciliation script for `audio` rows and track relationships.

## Existing Schema Patterns

- Core tables: `artists`, `projects`, `tracks`, `audio`, `images`, `external_links`
- Join tables: `project_artists`, `project_tracks`, `track_artists`, `artist_images`, `project_images`, `track_images`, `artist_external_links`, `project_external_links`, `track_external_links`
- Relationships are mostly slug-based and rely on foreign keys plus explicit indexes.
- Historical migrations already use table rebuild patterns for incompatible changes. Review the latest numbered migration before adding a new one.

## Migration Habits To Preserve

- Keep migration filenames sequential with a four-digit prefix.
- Update `init.sql` when the end-state schema changes.
- Recreate indexes after any table rebuild.
- Check for direct SQL dependencies instead of assuming type errors will catch everything.
- Use remote D1 operations only. Do not use `--local` or `--preview` for D1 work in this repo.
- Before any remote D1 command, confirm the exact command with the user.
