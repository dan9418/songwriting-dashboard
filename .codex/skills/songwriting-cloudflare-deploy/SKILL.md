---
name: songwriting-cloudflare-deploy
description: Deploy or diagnose the Songwriting Dashboard Cloudflare Worker. Use when asked to publish the app, verify its deploy path, or investigate Wrangler deployment authentication for this repository.
---

# Songwriting Cloudflare Deploy

Use this skill for the repository's Cloudflare Worker deployment workflow.

## Current deploy path

The working build and publish command is:

```sh
npm run deploy
```

It runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`. The
deployed Worker is `songwriting-dashboard`; its D1 and R2 bindings are declared
in `wrangler.jsonc`. A successful local Next or OpenNext build does not publish
anything by itself.

## Workflow

1. Distinguish preparation, diagnosis, and live deployment. Follow the repo's
   `AGENTS.md`: do not deploy without the user's explicit approval for that
   publish.
2. Before a live deploy, inspect `git status --short` and report the commit that
   will be published. Do not silently include uncommitted changes.
3. Run `npm run deploy` after approval. It is the canonical deployment command;
   do not substitute a hand-written Wrangler command unless the user asks.
4. Report whether Cloudflare actually accepted the Worker publish, rather than
   treating a successful build as a deployment.

## Authentication boundary

Wrangler deployment authentication and application runtime credentials are
different concerns. The current local direct API fallback also reads
`CLOUDFLARE_API_TOKEN`, so do not assume that a token available to the app is a
valid deploy token.

- For an interactive one-off deploy, the user may choose Wrangler browser login.
  Do not run `wrangler login` or `wrangler logout` without an explicit request:
  those commands alter local authentication state and require user interaction.
- For automation, use a dedicated deploy token and map it to
  `CLOUDFLARE_API_TOKEN` only for the deployment command.
- Never print, copy, modify, or commit token values.

If Cloudflare rejects `workers/services/songwriting-dashboard` with `No access
to the specified service`, error `10000`, or a `/memberships` error such as
`9106`, stop. The build may be valid, but the Worker was not published. Refer
the user to `docs/infrastructure.md` for the account/token checks and recovery
paths; do not guess at permissions or retry with unchanged credentials.

## Reporting

For a successful deployment, state the deployed commit, Worker/service outcome,
and any non-blocking warnings. For a failed deployment, state the failed stage,
the non-sensitive error, whether any Worker change occurred, and the next
user-owned authentication step.
