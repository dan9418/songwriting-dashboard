# API and frontend guide

## UI structure

The root layout supplies the theme provider, toast provider, persistent shell,
navigation, and route progress UI. Primary screens are Home, Notebook, Artists,
Projects, Tracks, Audio, Tags, and Admin.

Feature pages are in `src/app/`; reusable controls are in `src/components/`.
Keep browser-interactive state in client components and data-loading work in
server pages or route handlers. Reuse `src/lib/client/api.ts` for browser calls
instead of duplicating fetch/error behavior in individual controls.

## API families

| Area | Route family | Responsibility |
| --- | --- | --- |
| Artists | `/api/artists` | Artist CRUD and artist-image actions. |
| Projects | `/api/projects` | Project CRUD, project images, and artist-scoped project views. |
| Tracks | `/api/tracks` | Track CRUD, bulk metadata, audio, documents, and images. |
| Tags | `/api/tags` | Tag CRUD and track associations. |
| Notebook | `/api/notebook/pages` | Notebook page CRUD backed by D1 plus R2 Markdown. |
| Images | `/api/images` | Image retrieval. |
| Admin | `/api/admin` | D1/R2 inspection and streamed backups. |

Route handlers should use the shared request helpers in `src/lib/api/request.ts`
and the structured error utilities in `src/lib/api/errors.ts`. Zod errors should
remain useful to callers without exposing credentials or internal service details.

## UI conventions

- Use the existing entity layouts, sortable lists/tables, quick-edit modals, and
  shared form primitives before adding feature-specific versions.
- Preserve responsive behavior: the most recent UI work optimized tabular views
  for mobile layouts.
- The design system and theme tokens live in `src/lib/theme/` and the theme
  components. Update Storybook stories when changing reusable UI primitives.
- The Admin UI is powerful by design; avoid exposing it outside Cloudflare Access.

## Media behavior

Audio streaming supports HTTP byte ranges through R2, which lets browser players
seek without downloading an entire object. Audio metadata is D1-owned; the UI
can surface missing R2 files rather than silently manufacturing metadata.
