# Songwriting Dashboard Knowledge Base

This directory is the maintained reference for the system. It records how the
application works today, its operational constraints, and the decisions that
make a future change safer to reason about.

## Start here

- [Architecture](architecture.md) explains the application layers and request paths.
- [Infrastructure](infrastructure.md) covers Cloudflare, configuration, deployment, and access.
- [Data model](data-model.md) describes D1 entities, relationships, validation, and R2 object conventions.
- [Development and operations](development-and-operations.md) covers local work, verification, migrations, backups, and scripts.
- [API and frontend](api-and-frontend.md) maps the UI, API surface, and shared implementation conventions.
- [Known issues and maintenance](known-issues-and-maintenance.md) tracks current risks and planned upkeep.

## Documentation conventions

- Describe current behavior, then explicitly label proposals and historical notes.
- Keep credentials, access tokens, and production data out of this repository.
- Update the relevant page in the same change as a material architecture, schema,
  storage, deployment, or operational-process change.
- Treat `scripts/sql/init.sql` and `scripts/sql/migrations/` as the executable
  source of truth for D1; this documentation is an explanatory companion.
