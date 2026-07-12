# Doc index

One line per doc. Start at `AGENTS.md` (repo root) if you haven't already.

## Root

- `AGENTS.md` — router: repo shape, the signing-parity invariant, tier model, workflow, hard rules.
- `CLAUDE.md` — short pointer to `AGENTS.md` + the one invariant that overrides default behavior.
- `README.md` — install, quick-start, key management, signing, clients, validation, errors, examples, module imports, project structure. Port examples are stale — see `docs/agents/conventions.md`.
- `CHANGELOG.md` — release-please generated; tracks wire-alignment, dropNulls, OpenAPI-artifact, transitionPolicy/rc.7, OIDC history.
- `BREAKING_CHANGES.md` — v1.0.0 ts-proto migration, v1.1.1 StateId→string, v2.0.0 fiber-apps overhaul (renames + accessor API), v2.1.0 identity/oracle proto unification.
- `TESTING.md` — jest v29 + ts-jest, `retryTimes:2`, known-flaky-suite table, 50% coverage floor, flaky-debug loops.

## `docs/`

- `docs/SDK-STRUCTURE.md` — directory layout, per-app convention. Partly stale (shows `oracles/`, old `types.ts` shape) — verify against `src/` before trusting a specific path.
- `docs/type-architecture.md` — the dual wire-vs-proto type system, when-to-use table, removed generators, post-chain-PR#89 migration plan. Owned by the `wire-compat` persona.
- `docs/signing-and-publishing.md` — signing-canonical parity rules (`JCS∘dropNulls`, required-vs-optional), subpath exports, OIDC publishing pitfalls. Owned by the `signing-parity` persona.
- `docs/adding-a-new-app.md` — the definitive worked-example guide for building a new domain end-to-end (proto schema → explorer UI), using Contracts as the example.
- `docs/reviews/fiber-app-alignment-audit-2026-06.md` — the 105-finding SDK↔chain security/alignment audit (systemic classes S1/S2/A1–A4). Owned by the `app-authoring-safety` persona; primary source for that persona's checklist.
- `docs/design/app-hardening-identity-integration.md` — closes the design-gated remainder of the alignment audit (protocol/data-model decisions the remediation waves deferred).
- `docs/design/asset-model-token-spec.md` — asset model: DFA + JsonLogic integration spec.
- `docs/design/ergo-patterns-as-fiber-primitives.md` — Ergo/eUTXO patterns mapped onto fibers (sigma-protocols → JLVM verifier opcodes); mixer, note pool, staked-pool primitives.
- `docs/design/metakit-privacy-extensions-handoff.md` — handoff doc for privacy primitives to add to metakit/metakit-sdk (competitive gap analysis vs Midnight/Aztec/Zcash/Penumbra/Aleo).
- `docs/design/producer-validator-framework.md` — producer-validator architecture for the asset model app.
- `docs/design/shielded-transfer-app-sketch.md` — RFC sketch: confidential value transfer as a standard fiber app over metakit-sdk's `zk-shielded` circuit.
- `docs/design/token-behavior-matrix.md` — 16-type token behavior reference matrix for asset-model apps.
- `docs/design/zk-loan-app.md` — privacy-preserving collateralized loan app (zero-knowledge eligibility proof), modeled on Midnight's zkLoan example.
- `docs/proposals/fiber-app-schema.md` — proposal: JSON-schema single source of truth for fiber app definitions + build-time type generation.
- `docs/proposals/fiber-apps-overhaul.md` — proposal that produced the current `<app>-<variant>` state-machine layout (superseded the earlier fragmented/monolithic app shapes).
- `docs/archive/` — archived JSON state machines (`corporate/`, `governance/`); not prose docs, historical fixtures only.

## `docs/agents/` (this scaffold)

- `docs/agents/README.md` — how personas / worksheets / feedback / `bin/` fit together in this repo.
- `docs/agents/review-personas/signing-parity.md` — owns `docs/signing-and-publishing.md`; reviews anything touching signed-message bytes.
- `docs/agents/review-personas/wire-compat.md` — owns `docs/type-architecture.md` + `openapi/README.md`; reviews OpenAPI/proto regen, version pins.
- `docs/agents/review-personas/app-authoring-safety.md` — owns `docs/reviews/fiber-app-alignment-audit-2026-06.md`; reviews `src/apps/**` guard/effect changes.
- `docs/agents/review-personas/ai-smells-test-integrity.md` — owns `docs/agents/conventions.md`; reviews test-file changes for AI-authored-test smells.
- `docs/agents/blast-radius.md` — the T3+ file list + escalation protocol.
- `docs/agents/conventions.md` — pnpm/build/test/naming/port/commit conventions not covered by a linter.
- `docs/agents/tools.md` — `bin/` + `scripts/*` reference table, env vars.
- `docs/agents/feedback.md` — append-only lessons log.

## `docs/worksheets/` (this scaffold)

- `docs/worksheets/README.md` — worksheet habit: when to open one, naming, commit trailer, tags.
- `docs/worksheets/TEMPLATE.md` — the section structure every worksheet starts from.

## Nested READMEs

- `openapi/README.md` — vendored OpenAPI contract: file layout, refresh flow (`pnpm fetch:openapi && pnpm gen:openapi`), the ML0-vs-DL1 contract split.
- `proto/README.md` — proto source layout, `buf generate` / `buf lint` usage.
- `examples/README.md` — index of runnable example scripts.
- `examples/contracts/README.md`, `examples/governance/README.md`, `examples/identity/README.md`, `examples/lending/README.md`, `examples/markets/README.md` — per-domain example walkthroughs.
- `tests/fixtures/riverdale-economy/README.md` — the multi-fiber/asset e2e economy fixture used by integration tests.
