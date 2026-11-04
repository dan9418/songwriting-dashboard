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

Current application-runtime configuration for the direct API fallback:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET` (defaults to `songwriting-media` in code)
- `CLOUDFLARE_R2_BUCKETS` (used by admin/backup tooling)
- `CLOUDFLARE_BINDING_MODE` (see [Architecture](architecture.md))

Do not commit real values, export them in logs, or add them to documentation.

## Authentication and secret separation

Two distinct authentication paths exist and should not share a long-lived secret
by default:

| Path | When it is used | Recommended credential handling |
| --- | --- | --- |
| Wrangler deployment | Before a Worker is published from a developer machine or CI. | Use browser login for an interactive one-off deploy, or a dedicated deploy token. |
| Application runtime fallback | Only when the app directly calls Cloudflare's D1 REST API or R2's S3-compatible API, as the current ordinary local Next.js flow does. | Keep runtime credentials local and separate from deployment credentials. |
| Worker bindings | Production Worker access to configured D1/R2 resources. | No app-level Cloudflare API token is required; Cloudflare authorizes the configured bindings. |

Wrangler recognizes `CLOUDFLARE_API_TOKEN`, while the current direct local-data
fallback also reads that variable. This overlap is a legacy convenience and a
source of confusion. Do not permanently use the same token for both purposes.

For a dedicated deploy token, keep a private source variable such as
`CLOUDFLARE_API_TOKEN_DEPLOY` and map it only for the deployment process:

```sh
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN_DEPLOY" npm run deploy
```

Until the direct local fallback is retired, it still expects
`CLOUDFLARE_API_TOKEN` along with the other runtime variables above. Keep that
runtime token out of shell profiles and out of files that Wrangler may load for
a deploy.

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

## Deployment access troubleshooting

If Wrangler reports `No access to the specified service` or Cloudflare API error
`10000` for the `workers/services/songwriting-dashboard` endpoint, the
application bundle was built successfully but Cloudflare rejected the publish
before the Worker was changed. A `/memberships` failure such as `9106` indicates
that the custom token cannot complete Wrangler's account-identity checks. These
are account or API-token authorization problems, not Next.js or OpenNext build
failures.

Before retrying, verify that:

1. `CLOUDFLARE_ACCOUNT_ID` names the account that owns the Worker service.
2. The API token belongs to a user or service identity with access to that
   account and service.
3. The token grants the Worker deployment permissions required by Wrangler, and
   has access to the D1 and R2 bindings referenced by `wrangler.jsonc`.
4. The Worker service name in `wrangler.jsonc` is still
   `songwriting-dashboard` in that account.

For a fast interactive deploy, remove the token variables from the shell, make
sure no repository `.env`, `.env.*`, or `.dev.vars` file supplies a
Wrangler-recognized token, and authenticate with the browser flow:

```sh
unset CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
npx wrangler logout
npx wrangler login
env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID npx wrangler whoami
env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_ACCOUNT_ID npm run deploy
```

Inspect token-variable *filenames* without printing values before using this
path:

```sh
rg -l --hidden -g '.env' -g '.env.*' -g '.dev.vars' \
  '^(CLOUDFLARE_API_TOKEN|CF_API_TOKEN)=' .
```

If this prints a file, temporarily remove or comment the matching assignment
before browser login, then restore it immediately after the deploy attempt. Do
not use `grep`, `rg -n`, `sed -n`, or another line-printing command on the file:
it can expose the token value. Confirm that `wrangler whoami` reports the
account ID in `wrangler.jsonc` before deploying. If a token reaches terminal
output, logs, or chat, treat it as compromised and revoke/replace it at
<https://dash.cloudflare.com/profile/api-tokens>.

For automation, use an account-owned token with a Workers **Editor** role scoped
to this Worker (or the Workers product); an existing Worker can be deployed by
an Editor, while creating a new Worker requires product-level Admin. Add D1/R2
permissions only when the deployment or its managed resources require them; add
Zone/Workers Routes access only when the configuration manages a route or custom
domain. Cloudflare's current [Workers authorization guidance](https://developers.cloudflare.com/workers/authorization/)
and [token template reference](https://developers.cloudflare.com/fundamentals/api/reference/template/)
are the authority for the exact, current permission set.

Do not paste the token into issues, logs, or this repository. Once access is
corrected, rerun `npm run deploy`; the existing build and OpenNext bundle need
no code change for this authorization error.

## Deployment verification

Wrangler reports a completed publish with `Deployed songwriting-dashboard
triggers` followed by a `Current Version ID`. When terminal output is truncated,
inspect the newest local Wrangler deploy log for those markers rather than
rerunning the deployment.

Observed behavior: `npx wrangler deployments list --name songwriting-dashboard`
can return `No access to the specified resource` after a successful browser-OAuth
publish. Do not use that read-only history lookup to overturn a deploy command
that reported a new version; it likely requires a distinct resource permission.

## Target development-data topology

This is the intended direction, not the current implementation:

```text
Production Worker -> production D1 + production R2 through bindings
Local Worker/preview -> development D1 + development R2 through remote bindings
```

Use the same binding names in application code and vary only the configured
resource targets by environment. D1 and R2 both support remote bindings during
local development. A separate remote development database and bucket protect
production data while still exercising the real Cloudflare resource behavior.
Cloudflare recommends local Worker execution with remote bindings over the older
fully-remote development mode for most workflows; see its [local development guide](https://developers.cloudflare.com/workers/local-development/).

Moving to this topology requires a separate implementation change: add a
development environment to `wrangler.jsonc`, provision the development D1/R2
resources, and retire or isolate the direct REST/S3 local fallback. Do not point
ordinary feature development at production data by default.

## Backup model

The Admin backup endpoint can stream ZIP exports of D1 and R2 content. Text
backups include database tables and Markdown objects; media backups include the
media paths. Exports include a `manifest.json` with object metadata and SHA-256
checksums. Backup artifacts under the `backups/` R2 prefix are excluded from
subsequent backup input to avoid recursive archives.

Before a schema or mass-storage change, create and retain a backup, record the
time and source environment, and verify the manifest before considering the
operation complete.
