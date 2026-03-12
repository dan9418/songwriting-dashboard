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
