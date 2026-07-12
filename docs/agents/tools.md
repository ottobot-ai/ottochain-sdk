# Tools — `bin/` and `scripts/`

## `bin/` conventions

Every `bin/` script is: `bash`, `set -euo pipefail` at the top, supports `--help` (prints usage
and exits 0), and **delegates to a `package.json` script or an existing `scripts/*.mjs` helper**
rather than re-implementing logic. A `bin/` script is a documented, discoverable command — not a
second place business logic lives.

**Standing instruction: keep this directory growing.** If you find yourself reconstructing the
same multi-step command sequence twice (from this doc, from CI YAML, from memory), that's a
signal to add a `bin/` script for it in the same PR, following the conventions above. Don't wait
for someone to ask for it explicitly — an undiscoverable command that only lives in one person's
shell history is exactly the kind of thing this scaffolding exists to prevent.

## `bin/` scripts in this repo

| Script | What it does |
|---|---|
| `bin/preflight [--fast]` | Mirrors CI locally: install → lint → format:check → typecheck → OpenAPI drift → app lint. `--fast` stops there; full also builds + tests. See its own `--help`. |
| `bin/test [pattern]` | `pnpm test -- <pattern>`; prints the golden-suite shortlist when run with no args. |
| `bin/pr-watch <pr#> [--interval 60] [--timeout 1800]` | Polls `gh pr checks` until green/red/timeout; dumps failing job log tails on failure. |
| `bin/tasks [label]` | `gh issue list` wrapper with this repo's label taxonomy. |
| `bin/worksheet <slug>` | Scaffolds `docs/worksheets/YYYY-MM-DD-<slug>.md` from `TEMPLATE.md`. |
| `bin/sync-openapi` | `GITHUB_TOKEN`-aware wrapper around `pnpm fetch:openapi && pnpm gen:openapi`, prints what to `git add`. |

## `package.json` scripts (canonical — `bin/` wraps these, doesn't replace them)

| Script | Purpose |
|---|---|
| `build` | `prebuild` (inline-json) → `build:cjs` → `build:esm` → `build:types` → `build:fixup`. |
| `test` / `test:coverage` | Jest, optionally with coverage (50% floor). |
| `lint` | `eslint src tests`. |
| `format` / `format:check` | Prettier write/check over `src tests` (JSON excluded, see `conventions.md`). |
| `generate` | `buf generate` — regenerates `src/generated/**` proto types from `proto/`. |
| `lint:proto` | `buf lint`. |
| `fetch:openapi` | Downloads the pinned ottochain OpenAPI release artifact into `openapi/`. |
| `gen:openapi` | `openapi-typescript openapi/ottochain-openapi-ml0.json -o src/generated/openapi.ts`. |
| `sync:openapi` | `fetch:openapi` + `gen:openapi`. |
| `docs` / `docs:watch` | typedoc. |
| `genesis:manifest` | `build` + `node scripts/emit-genesis-manifest.mjs genesis/std-manifest.json`. |

## `scripts/*.mjs` / `scripts/*.ts` helpers

| Script | Purpose |
|---|---|
| `scripts/inline-json.mjs` | Converts each app's `state-machines/*.json` into a generated `index.ts` of `<name>Def` exports. Runs as `prebuild`, before every `build`. |
| `scripts/fetch-openapi.mjs` | Reads `openapi/source.json`, resolves the pinned GitHub release, downloads assets. Needs `GITHUB_TOKEN` for a private repo or to avoid rate limits. |
| `scripts/lint-apps.mjs` | Standalone runner for `src/schema/guard-lint.ts` over every std-app definition (self-re-execs under `tsx`, no build needed). `--warn-as-error` to also fail on warnings. NOT wired into `build` — apps are remediated incrementally. See `docs/agents/review-personas/app-authoring-safety.md`. |
| `scripts/emit-genesis-manifest.mjs` | Emits the genesis pre-registration manifest consumed by cluster bootstrap. |
| `scripts/gen-sigma-mixer-fixture.ts` | Regenerates the sigma-mixer ZK fixture set. |
| `scripts/validate-sigma-mixer-guards.ts` | Validates sigma-mixer guard definitions against the regenerated fixtures. |

## Env vars

| Var | Used by | Notes |
|---|---|---|
| `GITHUB_TOKEN` | `scripts/fetch-openapi.mjs` (`pnpm fetch:openapi`) | Needed for a private-repo release fetch or to avoid GitHub API rate limits. `bin/preflight`'s OpenAPI drift check must degrade to a loud warning (not a hard failure) when this is absent and the fetch fails for auth reasons — don't treat a missing token as a build break. |
| `ZK_JLVM_BIN` | `src/zk/prover.ts` | Path to a prebuilt zk-jlvm host binary (SP1 prover subprocess). |
| `ZK_JLVM_MANIFEST` | `src/zk/prover.ts` | Path to the zk-jlvm `script` crate's `Cargo.toml`, run via `cargo run --release` if no prebuilt binary is set. |
| `SP1_PROVER` | `src/zk/prover.ts` (passed through to the child process) | Set to `cuda` for GPU proving — see the `sp1-gpu-proving` skill; the empty/default value silently falls back to CPU, which is slow but not wrong. |

## Local cluster

No `bin/cluster` here — use `just e2e-up` in the `ottochain` (chain) repo, or the
`tessellation-cluster` skill directly, to stand up ML0/DL1 nodes this SDK's clients talk to.
