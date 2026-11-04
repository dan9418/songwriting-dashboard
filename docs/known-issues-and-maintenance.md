# Known issues and maintenance

## Current security status

The dependency sweep and framework migration completed on 2026-11-04. The app
now uses Next 16.4.5, TypeScript 6.0.2, and Vitest 5.1.0; linting, type
checking, unit tests, and the Next/OpenNext production builds pass.
`npm audit --omit=dev` reports no production vulnerabilities.

Next 16's native flat ESLint configuration replaced the legacy `FlatCompat`
adapter. Its new React Compiler-oriented rules for error boundaries, synchronous
effect state, and manual memoization are temporarily disabled because they flag
existing patterns that require an intentional code-level migration. ESLint
remains on the latest 9.x release: Next 16's bundled React, import, and JSX-a11y
plugins do not yet declare support for ESLint 10.

## Planned dependency review

The following available updates are still majors and should be evaluated
separately:

- Tailwind CSS 4
- TypeScript 7
- ESLint 10

TypeScript 7 remains deferred until the ecosystem supports it. Version 7.0 does
not expose the traditional compiler API used by tools such as `typescript-eslint`
and Storybook's type-documentation tooling. The TypeScript 6 bridge migration
removed the obsolete `baseUrl` compiler option, which TypeScript 7 rejects.

Before enabling the deferred React Compiler-oriented ESLint rules, address each
reported pattern deliberately and add coverage for changed rendering or state
behavior.

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
- OpenNext warns that the Worker `compatibility_date` in `wrangler.jsonc` is
  behind the currently available runtime date. Review Cloudflare's compatibility
  changes before advancing it; the setting can alter deployed Worker behavior.
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
