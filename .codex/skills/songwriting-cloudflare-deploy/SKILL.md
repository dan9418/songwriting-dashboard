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

## Authentication recovery

If Cloudflare rejects `workers/services/songwriting-dashboard` with `No access
to the specified service`, error `10000`, or a `/memberships` error such as
`9106`, stop: the bundle may be valid, but the Worker was not published. State
that outcome, then offer these two recovery paths directly. Do not retry with
unchanged credentials.

### Path A: one-off browser login

This changes the local Wrangler login state, so present the following block for
the user to copy or run it only after they explicitly approve that auth-state
change. The first command prints matching filenames only, never token values.

```sh
# If this prints a file, temporarily remove or comment the token assignment in it
# before continuing; otherwise Wrangler can keep choosing token auth.
rg -l --hidden -g '.env' -g '.env.*' -g '.dev.vars' \
  '^(CLOUDFLARE_API_TOKEN|CF_API_TOKEN)=' .

unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
npx wrangler logout
npx wrangler login
env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID npx wrangler whoami
env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID npm run deploy
```

`wrangler login` opens the browser authorization flow. Use the
[Wrangler login command reference](https://developers.cloudflare.com/workers/wrangler/commands/#login)
if it does not open automatically. Confirm that `whoami` reports the account ID
in `wrangler.jsonc` before publishing. Do not use `rg -n`, `grep`, `sed -n`, or
any other line-printing command on a credential file: the filename-only `rg -l`
check is intentional. If the token assignment is temporarily disabled, restore
it without printing its value immediately after the deployment attempt. Treat
any token exposed in terminal output as compromised and direct the user to
revoke and replace it.

### Path B: dedicated deploy token

Create or review a token at
`https://dash.cloudflare.com/profile/api-tokens`. It must belong to the
Cloudflare account that owns `songwriting-dashboard` (the configured account ID
is in `wrangler.jsonc`). For this existing Worker, grant **Workers Editor**
either on this Worker or at the Workers product scope. Add **Workers Routes
Write** only when the deployment manages routes or custom domains. Bound D1 and
R2 resources do not need separate deploy permissions unless a separate command
accesses them directly. If the Worker must be created rather than updated,
Workers **Admin** is required.

Store the token under a private shell variable; do not paste it into the repo,
chat, or a `.env` file that Wrangler loads. Then map it only for deployment:

```sh
# Set CLOUDFLARE_API_TOKEN_DEPLOY privately in the current shell first.
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN_DEPLOY" npm run deploy
```

Use Cloudflare's [Workers authorization guide](https://developers.cloudflare.com/workers/authorization/)
to choose the current resource scope. If `/memberships` still fails after the
token scope is corrected, verify that the token identity is a member of the
target account before retrying.

## Confirming a publish

Wrangler confirms a successful publish with `Deployed songwriting-dashboard
triggers` and a `Current Version ID`. If command output is truncated, inspect
the newest local Wrangler deploy log for those markers rather than repeating the
deployment. A post-deploy `npx wrangler deployments list --name
songwriting-dashboard` query can be denied even after a successful publish, so
do not treat that read-only lookup as the source of truth when the deploy
command already reported a version.

## Reporting

For a successful deployment, state the deployed commit, Worker/service outcome,
and any non-blocking warnings. For a failed deployment, state the failed stage,
the non-sensitive error, whether any Worker change occurred, and the next
user-owned authentication step.
