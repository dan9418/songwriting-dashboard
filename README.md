# Songwriting Dashboard

## Purpose

This is a local-first songwriter data management system designed to replace ad hoc filesystem organization with a structured, enforceable metadata-driven architecture.

The app manages:
- Archived music projects (albums, EPs, singles, setlists)
- Active/unfinished tracks
- Lyric fragments for creative experimentation
- Structured metadata to support AI-assisted creative workflows

This system is designed for long-term creative durability, not casual file storage.

---

## Core Principles

1. Filesystem is the source of truth.
2. Markdown files store all metadata and structured content.
3. Audio and image files are manually managed outside the app.
4. The app edits metadata only (no upload/download handling).
5. Audio filenames are strictly enforced by a naming convention.
6. Slugs are derived from required track metadata.
7. The system must scale to hundreds of existing audio files.

---

## App Sections

### 1. Archive (Mostly Static, Public-Readable in Future)
Strict artist → project → track hierarchy.

- Artists
  - Projects (album | EP | single | setlist)
    - Tracks

Tracks:
- May have multiple artists
- Contain metadata in track.md
- Audio files stored under /audio
- Images stored under /img

Allowed project types:
- album
- EP
- single
- setlist

---

### 2. Sandbox (Creative Workspace)

For experimentation and iteration.

- Tracks
  - Multiple audio versions
  - Working lyrics
  - Tabs
  - Notes
  - Images
- Fragments
  - Text-only lyric stubs
  - Structured metadata

No strict artist mapping required here.

---

### 3. Search

Global search across:
- Tracks
- Fragments
- Projects
- Artists

Supports:
- Full-text search
- Tag filters
- Type filters

---

### 4. Account

User metadata and app settings.

---

## Filesystem Architecture

Root:
songwriting-data/

Key Structure:

songwriting-data/
  users/
    {user}/
      user.md
      sandbox/
        tracks/
        fragments/
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

---

## Audio File Naming Convention

Required format:

{Track Name} - {category} {versionNumber} ({MM-DD-YY}) [{optionalDescription}].mp3

Example:
Midnight Drive - demo 2 (02-14-25) [acoustic].mp3

The app must:

- Parse required metadata from filename:
  - Track Name
  - Category
  - Version Number
  - Date
- Generate a slug from required metadata
- Validate filenames against metadata
- Automatically rename files when required metadata changes
- Reject invalid filename structures

This is critical because there are hundreds of existing audio notes already following this convention.

---

## Metadata Storage

All structured data is stored in markdown files using YAML frontmatter.

Examples:
- artist.md
- project.md
- track.md
- fragment.md

Mood is implemented as a tag, not a dedicated property.

Tracks can have multiple artists.

---

## Functional Requirements

- Local-first app
- Reads/writes markdown metadata
- Parses and validates audio filenames
- Generates and enforces slugs
- Supports multiple artists per track
- Public read-only mode for Archive (future)
- No media upload/download system
- No cloud sync (initially)

---

## Tech Stack (Initial Recommendation)

Backend:
- Node.js
- TypeScript
- File-based data access
- Gray-matter (markdown + frontmatter parsing)
- Zod (schema validation)

Frontend:
- Next.js (App Router)
- React
- Local API routes
- Tailwind for UI

Search:
- Lightweight indexed search (FlexSearch or MiniSearch)

Future AI Layer:
- Structured export endpoints
- JSON view of tracks/fragments
- Tag-driven grouping logic

---

## Goals

- Enforce creative discipline via structure
- Make large audio archives queryable
- Support project grouping (including setlists)
- Enable AI-assisted lyric and theme analysis
- Create a public archive view later

---

## Non-Goals (For Now)

- Cloud storage
- Real-time collaboration
- Media streaming optimization
- Authentication complexity
- Upload/download pipelines
- Enterprise scalability

This is a personal, durable creative system.