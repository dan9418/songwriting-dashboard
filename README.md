# Songwriting Dashboard

## Purpose

This is a songwriter data management system backed by Cloudflare D1 (metadata) and R2 (media/files), designed to replace ad hoc filesystem organization with a structured, enforceable metadata-driven architecture.

The app manages:
- Archived music projects (albums, EPs, singles, setlists)
- Active and unfinished tracks
- Lyric fragments for creative experimentation
- Structured metadata for future AI-assisted workflows

## Core Principles

1. D1 stores relational metadata used by the app.
2. R2 stores media and file assets referenced by metadata.
3. Slugs and relationships are enforced in the database layer.

## Entity Model

Top-level entities (single-user layout):
- `artists`
- `projects`
- `tracks`
- `fragments`

Relationship model:
- Project -> Artist (N:1 via `artistSlug`)
- Track -> Project (N:1 via optional `projectSlug`)
- Fragments are independent and can reference tracks by slug.

Sandbox behavior:
- Sandbox tracks are tracks with no `projectSlug`.

## Data Architecture

- D1 schema and seed scripts: `scripts/sql/` and `scripts/seed-d1.js`
- R2 media upload helper: `scripts/upload-media.js`

## Audio Filename Convention

Required format:

`{Track Name} - {category} {versionNumber} ({MM-DD-YY}) [{optionalDescription}].mp3`

Example:

`Midnight Drive - demo 2 (02-14-25) [acoustic].mp3`

The app parses filename metadata, validates consistency with track metadata, and auto-renames metadata filenames when required fields change.
