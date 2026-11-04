# Songwriting Dashboard

A private metadata and media-management application for artists, projects,
tracks, audio, images, tags, and notebook pages. Cloudflare D1 stores
relational metadata; Cloudflare R2 stores media and Markdown documents.

## Start here

Requires Node.js 22.12 or later and npm.

```sh
npm install
# Create .env.local with the runtime configuration described below.
npm run dev
```

For Worker-style previews, copy `.dev.vars.example` to `.dev.vars` and configure
its values. Normal Next.js development uses `.env.local`; neither file is
committed. See the [configuration guide](docs/infrastructure.md#configuration)
for the variables, binding modes, and credential boundary.

Before sharing a change, run:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Documentation

The [knowledge base](docs/README.md) is the maintained system reference:

- [Architecture](docs/architecture.md)
- [Data model and storage conventions](docs/data-model.md)
- [Infrastructure and deployment](docs/infrastructure.md)
- [Development and operations](docs/development-and-operations.md)
- [API and frontend guide](docs/api-and-frontend.md)
- [Known issues and maintenance](docs/known-issues-and-maintenance.md)

In particular, review the [D1 safety rules](docs/development-and-operations.md#d1-safety-rules)
before database work and the [deployment workflow](docs/infrastructure.md#commands)
before publishing. Deploys and remote D1/R2 operations can affect production
data.
