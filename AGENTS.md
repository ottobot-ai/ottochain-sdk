# AGENTS.md — router

This is `@ottochain/sdk`, the TypeScript client SDK for the ottochain metagraph
(Constellation Network / tessellation). Single package, pnpm, dual CJS+ESM+types build,
subpath exports (`.`, `./core`, `./metakit`, `./zk`, `./templates`, `./apps/*`, `./generated`).
Origin remote is the `ottobot-ai` fork; CODEOWNERS is `@scasplte2` on every path.

## READ FIRST — the one invariant that matters

**Signing-canonical parity.** The chain verifies every `Signed<DataUpdate>` over
`JCS(dropNulls(payload))`. If the SDK's bytes diverge from the chain's re-encoding, every
update fails with an opaque `InvalidSignature` (often an empty-body HTTP 400). Two rules:

1. Object-null fields are dropped recursively before signing; **array** nulls are preserved.
   Mirror: `src/ottochain/drop-nulls.ts`.
2. A field the chain marks REQUIRED (defaulted on decode) must be **required** in the SDK's
   TS type, never optional — omitting it silently diverges the canonical. Truly-optional
   (`Option` on chain) fields stay optional and get omitted.

Field **names** on signed messages are consensus-load-bearing. Any change to
`src/schema/fiber-app.ts`, `src/ottochain/types.ts`, or `src/generated/**` needs a golden-test
case in `tests/ottochain/signing-parity.test.ts` or the sibling parity suites — see
`docs/agents/review-personas/signing-parity.md` before touching any of those files.

## Tier model — route by the minimum tier that can safely do the job

(Vocabulary: `agent-swarm-architecture/docs/model-capability-tiers.md`, Tier 0–4.)

- **T0–1 (free for any model):** tests (new ones), docs, `bin/`, worksheets, OpenAPI regen,
  comments, examples.
- **T2 (review-first):** client code (`src/ottochain/metagraph-client.ts`, `src/ottochain/
  transaction.ts`), app/state-machine definitions under `src/apps/**`.
- **T3+ (propose-only for cheap models):** anything in `docs/agents/blast-radius.md`. A senior
  model or a human decides; cheap models draft a diff and stop.

## Workflow

1. `git fetch origin` — never branch off a stale local `main`.
2. `git checkout -b <type>/<slug> origin/main` (worktrees fork MAIN HEAD — always rebase onto
   `origin/main` explicitly, don't trust the checked-out ref).
3. Open a worksheet: `bin/worksheet <slug>` (see `docs/worksheets/README.md`).
4. Work in small commits. Conventional prefixes, lowercase subject, **≤72 chars measured**:
   `s="..."; printf '%d %s\n' "${#s}" "$s"` before every commit.
5. `bin/preflight` (or `--fast` for a quick pass) before opening a PR.
6. Open the PR against `main` (verified dominant base — `gh pr list --state merged --json
   baseRefName`).
7. `bin/pr-watch <pr#>` until checks are green. **"PR opened" is not done. Done = checks green
   and watched** — an unmonitored PR is an unfinished task.

## Hard rules

- **Never merge.** The `ottobot-ai` gh identity opens PRs and pushes branches; it does not
  merge. James (`scasplte2`) merges everything.
- **Publishing is tag-driven OIDC only, never local.** `release-please.yml` (push→main) opens a
  release PR; merging it tags `v*`, which triggers `release.yml` (OIDC → npm). Don't run
  `npm publish` / `pnpm publish` by hand.
- **`src/generated/**` is regenerate-only.** Never hand-edit; `pnpm generate` (proto) / `pnpm
  gen:openapi` (OpenAPI) are the only writers.
- Terminology: **"script"**, never "oracle", for the general on-chain script/oracle-fiber
  concept — matches the chain's naming. `src/apps/oracles/` and `identity-oracle` app names are
  grandfathered domain-specific identity-oracle content, not the deprecated general term; don't
  spread "oracle" into new generic code or docs.

## Where to go next

- `docs/INDEX.md` — every doc in this repo, one line each.
- `docs/agents/README.md` — how personas / worksheets / feedback / `bin/` fit together here.
- `docs/agents/review-personas/` — four owned-doc checklists for reviewing diffs.
- `docs/agents/blast-radius.md` — the T3 file list + escalation protocol.
- `docs/agents/conventions.md` — pnpm/build/test/naming/commit conventions.
- `docs/agents/tools.md` — `bin/` and `scripts/*` reference, env vars.
- `docs/worksheets/` — template + habit.
