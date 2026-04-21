# AGENTS.md

## Working Rule

NEVER take action without explicit consent. When presented with a statement, question, or ambiguous content, ALWAYS ask for clarification first.

If you have any uncertainty about the user's expectations, intended outcome, constraints, or the feasibility of a requested change, ask for clarification before taking action.

Do not guess when a material assumption could affect:
- what should be built or changed
- whether the request is technically feasible
- whether the requested approach is the right one
- whether work might be destructive, risky, or wasteful

When in doubt, pause and ask a concise clarification question first.

## Database Rule

All database operations for this repo must be performed against the remote Cloudflare D1 database only.

Do not run local D1 migration, execute, or apply commands.
Do not use `--local` or `--preview` for D1 operations in this repo.
Before any destructive remote D1 operation, get explicit user consent and state the exact command you plan to run. Dry runs and readonly queries do not require approval.
