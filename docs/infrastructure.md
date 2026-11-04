# Infrastructure and deployment

## Cloudflare resources

`wrangler.jsonc` defines the deployed Worker and its bindings:

| Resource | Binding | Role |
| --- | --- | --- |
| Cloudflare D1 | `songwriting_dashboard` | Relational metadata and relationships. |
| Cloudflare R2 | `songwriting_media` | Audio, images, track Markdown, notebook Markdown, and backup artifacts. |
| Workers assets | `ASSETS` | OpenNext static output. |
| Worker service | `WORKER_SELF_REFERENCE` | Self-reference required by the OpenNext deployment. |
| Cloudflare Images | `IMAGES` | Image binding configured for the Worker. |

The application is intended to be private. After deployment, protect the
`workers.dev` domain with Cloudflare Zero Trust/Access and an allow policy for
the intended user. Never rely on a hidden URL as access control.

## Configuration

Copy `.dev.vars.example` to `.dev.vars` for Worker-style previews. Use
`.env.local` for normal Next.js development. Both are ignored by Git.

Required secrets and identifiers:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET` (defaults to `songwriting-media` in code)
- `CLOUDFLARE_R2_BUCKETS` (used by admin/backup tooling)
- `CLOUDFLARE_BINDING_MODE` (see [Architecture](architecture.md))

Do not commit real values, export them in logs, or add them to documentation.

## Commands

| Command | Use |
| --- | --- |
| `npm run dev` | Run the Next.js development server. |
| `npm run build` | Build and type-check a production Next.js bundle. |
| `npm run preview` | Build and preview the OpenNext/Cloudflare output. |
| `npm run deploy` | Build and deploy to Cloudflare. |
| `npm run cf-typegen` | Regenerate Worker binding types. |

Deploys are an external state change. Verify the target account, configured
bindings, and Access policy before running `npm run deploy`.

## Backup model

The Admin backup endpoint can stream ZIP exports of D1 and R2 content. Text
backups include database tables and Markdown objects; media backups include the
media paths. Exports include a `manifest.json` with object metadata and SHA-256
checksums. Backup artifacts under the `backups/` R2 prefix are excluded from
subsequent backup input to avoid recursive archives.

Before a schema or mass-storage change, create and retain a backup, record the
time and source environment, and verify the manifest before considering the
operation complete.
