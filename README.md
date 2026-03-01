# Songwriting Dashboard

## Purpose

This is a local-first songwriter data management system designed to replace ad hoc filesystem organization with a structured, enforceable metadata-driven architecture.

The app manages:
- Archived music projects (albums, EPs, singles, setlists)
- Active and unfinished tracks
- Lyric fragments for creative experimentation
- Structured metadata for future AI-assisted workflows

## Core Principles

1. Filesystem is the source of truth.
2. Markdown files store all metadata and structured content.
3. Audio and image files are manually managed outside the app.
4. The app edits metadata only.
5. Audio filenames are strictly validated by naming convention.
6. Slugs are derived from required metadata.

## Entity Model

Top-level entities under each user:
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

## Filesystem Architecture

```text
songwriting-data/
  users/
    {user}/
      user.md
      artists/
        {artist}/
          artist.md
      projects/
        {project}/
          project.md
      tracks/
        {track}/
          track.md
          audio/
          img/
      fragments/
        {fragment}/
          fragment.md
```

## Audio Filename Convention

Required format:

`{Track Name} - {category} {versionNumber} ({MM-DD-YY}) [{optionalDescription}].mp3`

Example:

`Midnight Drive - demo 2 (02-14-25) [acoustic].mp3`

The app parses filename metadata, validates consistency with track metadata, and auto-renames metadata filenames when required fields change.
