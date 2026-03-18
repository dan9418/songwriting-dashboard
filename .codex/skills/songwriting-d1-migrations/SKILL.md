---
name: songwriting-d1-migrations
description: Plan, review, and execute Cloudflare D1 schema migrations for the songwriting-dashboard repo. Use when this repo needs a database schema change, a new SQL migration under scripts/sql/migrations, an update to scripts/sql/init.sql, a migration risk review, a backfill/data-preservation plan, or approval-gated Wrangler execution against the remote Cloudflare D1 database.
---

# Songwriting D1 Migrations

Treat this skill as the repo-specific workflow for D1 schema work.

Start by reading [references/repo-map.md](references/repo-map.md), then inspect only the files touched by the requested change.

## Workflow

1. Clarify the request before taking action.
   Distinguish between planning only, file edits, and live execution.
   Ask concise follow-up questions when the request leaves any of these unclear: target schema, existing data to preserve, nullability/defaults, uniqueness, foreign keys, indexes, rollout order, rollback expectations.
2. Build a migration brief before editing.
   Write down the goal, affected tables and columns, data migration strategy, app code likely to change, validation plan, and the exact approval still needed.
3. Review pitfalls and alternatives.
   Call out destructive operations, data backfills, cascade effects on joins and slugs, index loss during table rebuilds, stale seed/import scripts, and whether an additive change would be safer than a destructive one.
4. Pause for approval before changing files.
   Summarize the files you intend to edit and the migration shape you intend to implement.
   Do not create or edit migration SQL, schema files, or app code until the user explicitly approves.
5. Implement after approval.
   Add the next numbered SQL file under `scripts/sql/migrations/`.
   Update `scripts/sql/init.sql` whenever the canonical schema changes so fresh databases match the fully migrated shape.
   Update any app code, scripts, or tests that depend on the changed schema.
6. Pause again before live execution.
   Show the exact Wrangler command you plan to run and confirm that it targets `--remote`.
   Do not run live D1 commands without explicit approval.
7. Validate and report.
   Verify SQL ordering, recreated indexes and constraints, affected queries, and any manual follow-up.
   Report what changed, what was validated, and what still needs user confirmation.

## Repo Rules

- Follow this repo's `AGENTS.md`: never take action without explicit consent.
- Prefer concise clarification questions over assumptions when a schema choice would materially change the implementation.
- Treat remote D1 operations as high risk. Planning and review can proceed without approval; edits and execution cannot.
- Never use local or preview D1 execution for this repo. All D1 migrations and ad hoc D1 commands must target `--remote`.

## D1 Migration Design

- Prefer additive migrations when possible.
- For SQLite/D1 limitations, use the table rebuild pattern when a direct `ALTER TABLE` is not sufficient: create replacement table, copy data, drop old table, rename, recreate indexes.
- Recreate every index, unique constraint, foreign key, and check constraint that would otherwise be lost during a rebuild.
- Preserve and restore the foreign-key posture deliberately.
  Use `PRAGMA defer_foreign_keys = true` when a migration only needs temporary deferral during apply.
  If you choose `PRAGMA foreign_keys = OFF`, explain why that stronger setting is necessary and ensure it is turned back on in the same migration.
- For ad hoc SQL files executed through `npx wrangler d1 execute ... --remote --file`, do not include explicit `BEGIN TRANSACTION`, `COMMIT`, or `SAVEPOINT` statements.
  Wrangler/D1 rejects those statements in this execution path.
- Backfill before dropping old columns or tables.
- Keep slug-based relationships intact across `artists`, `projects`, `tracks`, `audio`, and join tables.
- If a column rename or removal affects inserts, updates, or reads, update all dependent SQL in the app during the same change.

## Review Checklist

- Does the migration preserve existing data?
- Does `scripts/sql/init.sql` match the final schema after all migrations?
- Do `scripts/sql/seed.sql`, `scripts/seed-d1.js`, or import/backfill scripts rely on the old shape?
- Do API routes or helpers select, insert, or update renamed or removed columns?
- Do admin table viewers or catalog helpers assume the old schema?
- Are indexes still present for common joins and lookups after a rebuild?
- Does the migration need a one-time backfill or cleanup statement?
- Is the execution plan remote and explicitly approved by the user?

## Wrangler Commands

Use the database name from `wrangler.jsonc`, which is currently `songwriting-dashboard`.

- Create a migration: `npx wrangler d1 migrations create songwriting-dashboard <message>`
- List unapplied migrations remotely: `npx wrangler d1 migrations list songwriting-dashboard --remote`
- Apply remotely: `npx wrangler d1 migrations apply songwriting-dashboard --remote`
- Run ad hoc SQL only when a one-off query is more appropriate than a tracked migration: `npx wrangler d1 execute songwriting-dashboard --remote --file <path>` or `--command "<sql>"`
  When using `--file`, omit explicit transaction wrappers such as `BEGIN TRANSACTION` and `COMMIT`.

Prefer tracked migrations in `scripts/sql/migrations/` over ad hoc remote SQL whenever the schema changes.

## Output Shape

When planning, respond with these sections:

- `Migration brief`
- `Pitfalls and optimizations`
- `Proposed file changes`
- `Approval needed`

When reviewing an existing migration, respond with findings first, then the approval recommendation.

When executing after approval, include:

- the migration file name
- any non-migration files changed
- the exact command run
- the validation performed
- any rollback or cleanup notes
