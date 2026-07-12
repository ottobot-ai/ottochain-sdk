# CLAUDE.md

See `AGENTS.md` first — it is the canonical router (repo shape, tier model, workflow, hard
rules, doc index).

## The one invariant that overrides default behavior

Signing-canonical parity: the chain verifies `Signed<DataUpdate>` over `JCS(dropNulls(payload))`.
Object-null fields drop recursively before signing; array nulls are preserved. Chain-REQUIRED
fields must be required (not optional) in SDK types. Field names on signed messages are
consensus-load-bearing. Never hand-edit `src/generated/**` — it is regenerate-only
(`pnpm generate`, `pnpm gen:openapi`). Full rationale: `docs/signing-and-publishing.md` and
`docs/agents/review-personas/signing-parity.md`.

Keep a worksheet current in `docs/worksheets/` whenever you reach a stopping point or finish a
task — see `docs/worksheets/README.md`.
