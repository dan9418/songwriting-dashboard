# Songwriting Dashboard

## Purpose

This is a songwriter data management system backed by Cloudflare D1 (metadata) and R2 (media/files), designed to replace ad hoc filesystem organization with a structured, enforceable metadata-driven architecture.

The active app model centers on three core entities:
- `artists`
- `projects`
- `tracks`

## Core Principles

1. D1 stores relational metadata used by the app.
2. R2 stores media and file assets referenced by metadata.
3. Slugs and relationships are enforced in the database layer.

## Entity Model

Relationship model:
- Artist <-> Project (M:N via `project_artists`)
- Project <-> Track (M:N via `project_tracks`, ordered by `position`)
- Artist <-> Track (M:N via `track_artists`)
- Track -> Audio (1:N via `audio.track_slug`)

Supplemental schema tables exist for images/social link metadata:
- `images`, `social_links`
- `artist_images`, `artist_social_links`
- `project_images`, `project_social_links`
- `track_images`

## Data Architecture

- D1 schema and seed scripts: `scripts/sql/` and `scripts/seed-d1.js`
- R2 backfill helper: `scripts/backfill-audio-from-r2.js`
- Track markdown docs (lyrics/chords/notes): `tracks/{trackSlug}/{docType}.md` in R2

## Audio Filename Convention

Required format:

`{track-slug}_{category}_v{versionNumber}_{M-D-YY|descriptor|YYYY-MM-DD|YYYY}_{optionalDescription}.{mp3|m4a|mp4}`

Example:

`midnight-drive_demo_v2_02-14-25_acoustic.m4a`

The app parses filename metadata, validates consistency with track metadata, and auto-renames metadata filenames when required fields change.

## Cloudflare Deploy

This app is configured to deploy to Cloudflare Workers with OpenNext.

Before the first deploy:
- Set up Cloudflare Zero Trust for your account.
- Ensure your account has a `workers.dev` subdomain.
- Create a Cloudflare API token that can access D1 and R2 for this app.

Local preparation:
- Copy `.dev.vars.example` to `.dev.vars` for local Worker-style previews if needed.
- Keep `.env.local` for local Next.js development.

Required secrets and vars:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_BUCKETS`

Useful commands:
- `npm run preview`
- `npm run deploy`
- `npm run cf-typegen`

After the first deploy:
- Open the Worker in Cloudflare dashboard.
- Enable Cloudflare Access for the `workers.dev` domain.
- Configure Access with One-time PIN.
- Add an allow policy for only your email address.
