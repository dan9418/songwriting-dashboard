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

Supplemental schema tables exist for images/external link metadata:
- `images`, `external_links`
- `artist_images`, `artist_external_links`
- `project_images`, `project_external_links`
- `track_images`, `track_external_links`

## Data Architecture

- D1 schema and seed scripts: `scripts/sql/` and `scripts/seed-d1.js`
- Audio migration map validator: `scripts/validate-audio-migration-map.js`
- Track markdown docs: one canonical combined file per track in R2. During phase 1 storage, the app-facing Notes document is stored at `tracks/{trackSlug}/lyrics.md`.

## Audio Files

Audio metadata is stored in D1. Each row has an independent UUID, display name,
musical category, date, optional date descriptor, and R2 object key. R2 remains
blob storage, with objects nested under `tracks/{trackSlug}/audio/`.

The app treats D1 as the source of truth. Missing R2 objects are surfaced as
missing files in the UI, and orphaned R2 objects can be reported by the audio
reconciliation endpoint without automatically creating metadata.

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
