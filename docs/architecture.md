# Architecture

## Purpose

Songwriting Dashboard is a private metadata and media-management application for
artists, projects, tracks, audio, images, tags, and notebook pages. It replaces
ad hoc filesystem organization with relational metadata in Cloudflare D1 and
media/document storage in Cloudflare R2.

## System shape

```text
Browser
  -> Next.js App Router pages and client controls
  -> /api route handlers
  -> domain validation and Cloudflare data-access modules
  -> D1 (metadata) + R2 (media and Markdown)

Cloudflare Worker runtime
  -> OpenNext worker
  -> D1/R2 bindings in production

Local Next.js runtime
  -> Cloudflare REST API and R2 S3-compatible API, using .env.local
```

The app is built with Next.js, React, TypeScript, Tailwind CSS, and Zod. It is
packaged for Cloudflare Workers by OpenNext.

## Runtime data access

`src/lib/cloudflare/d1.ts` and `src/lib/cloudflare/r2.ts` choose their transport
through `CLOUDFLARE_BINDING_MODE`:

- `always`, `binding`, or `bindings` uses Worker bindings when available.
- `never`, `remote`, or `rest` uses Cloudflare HTTP/S3 APIs.
- When unset, production prefers bindings and other environments use the remote APIs.

This fallback is deliberate: deployed requests should avoid an unnecessary trip
back through Cloudflare's public APIs, while ordinary local Next.js development
can use the same remote data with credentials in `.env.local`.

## Code organization

| Location | Responsibility |
| --- | --- |
| `src/app/` | App Router pages, route handlers, and feature-local client controls. |
| `src/components/` | Reusable UI, shell, entity lists, edit dialogs, and theme components. |
| `src/lib/domain/` | Shared entity types and Zod input/output validation. |
| `src/lib/cloudflare/` | D1, R2, catalog, entity, audio, document, admin, and backup access. |
| `src/lib/api/` | Request parsing, response creation, and structured API errors. |
| `scripts/` | Explicit operational imports, repairs, seed data, and migration helpers. |
| `scripts/sql/` | Schema initialization, seed SQL, and ordered D1 migrations. |
| `tests/unit/` | Fast unit coverage for parsing, schemas, query logic, and document migration helpers. |

## Application boundaries

- Route handlers validate input and translate expected failures into API errors.
- Cloudflare modules own persistence behavior; pages and components should not
  construct D1 SQL or R2 clients directly.
- `src/lib/client/api.ts` is the client-side boundary for browser mutation and
  retrieval requests.
- Entity slugs are stable identifiers and route keys. Display names may change.
- The Admin area exposes introspection and backup flows. It assumes the Worker is
  protected by Cloudflare Access; it is not a replacement for an authorization layer.
