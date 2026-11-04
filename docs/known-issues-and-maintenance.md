# Known issues and maintenance

## Current security maintenance item

The compatible dependency sweep completed on 2026-11-03 updated the lockfile to
the latest versions permitted by existing semver ranges, including Next 15.5.29
and Zod 4.6.7. Lint, type checking, unit tests, and the production build pass.

`npm audit --omit=dev` still reports two production findings (one high and one
moderate) through the PostCSS bundled by Next 15. The audit's available remedy
is Next 16, a major upgrade. Do not force that update as a routine patch; plan a
dedicated migration that covers Next, `eslint-config-next`, and deployment
compatibility.

## Planned dependency review

The following available updates are majors and should be evaluated separately:

- Next.js 16
- Tailwind CSS 4
- TypeScript 7
- ESLint 10
- Vitest 5

For each migration: create a focused branch, read the upstream migration notes,
update the coupled packages together, run the full verification command set,
exercise the Worker preview, and inspect the production build/deploy output.

## Known operational sharp edges

- Production D1 and R2 are real user data. A command that looks like setup may
  still be a remote mutation; use the D1 safety rules in
  [Development and operations](development-and-operations.md).
- Some import/repair scripts embed historical Windows backup/source paths and
  source-specific slug aliases. Treat them as one-off recovery tools, not
  general-purpose product features.
- Track document terminology is transitional: the supported type is `notes`,
  while the canonical stored filename is `lyrics.md`.
- Notebook mutations span R2 and D1. The implementation performs compensating
  object restore/delete attempts on failure, but no cross-service transaction
  exists.
- Admin functionality depends on Cloudflare Access being configured correctly;
  route presence alone does not establish user authorization.

## Maintenance cadence

- Run lint, typecheck, tests, and build before a feature branch is merged.
- Review compatible dependency updates and production audit output regularly.
- Review major upgrades deliberately, not alongside product work.
- Take and verify a backup before data migrations or bulk R2 operations.
- Revisit this page whenever a new operational risk, deferred migration, or
  production incident is discovered.
