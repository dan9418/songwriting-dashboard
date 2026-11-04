# Data model and storage conventions

## Core entities

The executable schema is [scripts/sql/init.sql](../scripts/sql/init.sql).

| Entity | Key fields | Notes |
| --- | --- | --- |
| `artists` | `slug`, `name`, `description` | Can belong to many projects and tracks. |
| `projects` | `slug`, `name`, `type`, release/remaster dates | Types are `album`, `ep`, `single`, and `setlist`. |
| `tracks` | `slug`, `name` | Can belong to many artists/projects/tags and owns audio. |
| `tags` | `slug`, `name` | Reusable track classification. |
| `audio` | UUID `id`, `track_slug`, type, date, `object_key` | One track has many files: `note`, `demo`, or `live`. |
| `images` | `slug`, `path` | Reused through entity/image join tables. |
| `external_links` | numeric `id`, `platform`, `url` | Reused through entity/link join tables. |
| `notebook_pages` | `slug`, metadata, `storage_path` | Metadata in D1; Markdown body in R2. |

## Relationships

```text
artists <- project_artists -> projects <- project_tracks(position) -> tracks
artists <- track_artists ------------------------------------------> tracks
tracks  <- track_tags ---------------------------------------------> tags
tracks  <- audio (one-to-many)

artists/projects/tracks <- *_images -> images
artists/projects/tracks <- *_external_links -> external_links
```

Join tables use foreign keys with cascading deletes and updates. `project_tracks`
also enforces a unique, one-based `position` within each project. The `audio`
table enforces unique object keys and unique `(track_slug, name)` pairs.

## Validation and identity

- Slugs must be non-empty kebab case: lowercase letters/numbers separated by
  single hyphens.
- Names are trimmed, non-empty strings.
- Date values use `YYYY-MM-DD`; timestamps are stored as non-empty strings.
- Client-facing payload schemas live in `src/lib/domain/schemas.ts`; shared
  domain types live in `src/lib/domain/models.ts`.
- Slug changes are materially significant: they affect routes, relationships,
  and R2 prefixes. Treat them as data migrations, not merely presentation edits.

## R2 object paths

| Content | Canonical path |
| --- | --- |
| Track document | `tracks/{trackSlug}/lyrics.md` |
| Audio | `tracks/{trackSlug}/audio/{file}` |
| Notebook page | `notebook/pages/{pageSlug}.md` |
| Backup artifact | `backups/...` (excluded from backup input) |

The current user-facing track document type is named `notes`, but its canonical
file name remains `lyrics.md` for compatibility with the earlier combined-track
document migration. Avoid inventing a second track-document path without a
migration plan.

Notebook Markdown must have valid frontmatter: `name`, `description`,
`page_type`, `created`, and `last_modified`. The application normalizes this
frontmatter on write and keeps the D1 index synchronized with it.
