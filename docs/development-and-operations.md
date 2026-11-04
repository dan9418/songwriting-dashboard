# Development and operations

## Routine local workflow

1. Install dependencies with `npm install`.
2. Create `.env.local` with the required Cloudflare credentials for remote data access.
3. Use `npm run dev` for ordinary development.
4. Before opening a change, run `npm run lint`, `npm run typecheck`, `npm test`,
   and `npm run build`.

The test suite is intentionally unit-focused. It covers parsing, schema rules,
query behavior, audio metadata, notebook Markdown, and track-document migration
helpers. It does not provide a substitute for a controlled remote-data check.

## D1 safety rules

- All repository D1 operations target the remote database; do not use local or
  preview D1 modes.
- Add schema changes as an ordered file in `scripts/sql/migrations/` and update
  `scripts/sql/init.sql` to represent a fresh installation.
- Before a destructive remote operation, record the exact command, take a
  backup, and obtain explicit approval.
- Review foreign keys, indexes, backfills, nullable/default behavior, and a
  rollback or recovery path before applying a migration.

## Operational scripts

Scripts are intentionally not `package.json` shortcuts because many can affect
remote D1 or R2. Inspect their arguments and dry-run behavior before execution.

| Script | Purpose | Safety note |
| --- | --- | --- |
| `migrate-track-docs.js` | Consolidates legacy lyrics/chords/notes Markdown into the canonical track document. | Dry run by default; `--execute` mutates R2. |
| `import-images-to-r2.js` | Imports image files and associated metadata. | Dry run by default; source defaults to a historical Windows path. |
| `seed-notebook.js` | Seeds archived notebook files into D1/R2. | Dry run by default; `--execute` mutates both stores. |
| `seed-d1.js` | Generates seed SQL and can execute it remotely. | Use only intentionally; never use a local D1 target. |
| `repair-music-relationships.js` | Reconciles relationships from an external historical music-data source. | External source and `--execute` require review. |
| `repair-track-names.js` | Reconciles track naming from that historical source. | External source and `--execute` require review. |
| `validate-audio-migration-map.js` | Checks a local media backup against migration `0009`. | Read-only; requires a valid backup-root path. |

## Change checklist

- Validate input at the route/domain boundary; do not trust browser payloads.
- Preserve D1/R2 consistency. When a multi-store operation can partly fail,
  retain or restore the previous object where practical, as notebook mutations do.
- Add or update unit tests when changing pure domain, parsing, or query logic.
- Update this knowledge base when changing an object path, table, binding,
  operational procedure, or known risk.
