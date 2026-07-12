# Blast radius — T3+ files

These files produce or mirror signed/consensus-visible bytes. A silent mistake here doesn't fail
a build — it ships and breaks signature verification, decode, or authorization on a live chain,
often only surfacing downstream (e2e, a consumer service, or a real user's rejected transaction).

Per `AGENTS.md`'s tier model: cheap models (T0–1 bundles) may **propose** a diff against these
files but must not decide it's correct and merge-ready on their own. Route to a senior model or
get explicit human sign-off before opening the PR, and the PR description must name every
blast-radius file touched and say why the change is safe.

## The list

- `src/signing.ts` — dropNulls-wrapped dataUpdate signing surface; shadows the upstream
  `@constellation-network/metagraph-sdk` signing fns. A bug here breaks every signature.
- `src/ottochain/drop-nulls.ts` — the `JsonBinaryCodec.dropNulls` mirror. Has a documented churn
  history of regressions (see `signing-parity.md`'s defect classes). High-risk even for
  "obviously correct" refactors.
- `src/verify.ts` — verification over null-dropped bytes; strips `mode` so explicit
  `isDataUpdate` wins. A mismatch between sign-time and verify-time null-dropping is invisible
  until a real signature fails.
- `src/schema/fiber-app.ts` — `toProtoDefinition`, `projectFiberPolicy`, `FIBER_POLICY_DIALS`,
  the `FiberPolicy` ADT. Every dial's exact chain casing is signature-load-bearing.
- `src/ottochain/transaction.ts` — builds `DataTransactionRequest`/DL1 `/data` payloads.
- `src/ottochain/types.ts` — hand-written wire types; required-vs-optional must mirror the
  chain's Option-vs-REQUIRED split exactly.
- `src/generated/**` — ts-proto types mirroring chain proto schemas. Regenerate-only
  (`pnpm generate`); a hand-edit here is worse than a blast-radius change, it's actively wrong
  — the next `pnpm generate` silently reverts it and reintroduces whatever it "fixed."
- `src/schema/guards.ts` + `src/schema/effects.ts` — canonical authz-guard builders (bind to
  `proofs[].address`) and reserved EFFECT-directive builders (`RESERVED_EFFECT_KEYS`); these
  become signed wire content for every app that uses them.
- `src/apps/**/state-machines/*.ts` — each is a signed `StateMachineDefinition`. See
  `app-authoring-safety.md` for the guard/effect-specific checklist; this entry is about the
  definition's SHAPE (fields that reach the wire) being blast-radius, independent of guard
  logic correctness.
- `src/ottochain/genesis-manifest.ts` — genesis pre-registration content mirroring chain Scala;
  a shape drift here is a hard decode failure at cluster genesis, not a soft one.
- `src/ottochain/webhook-notifications.ts` — off-contract webhook payloads mirroring chain
  Scala `Subscriber.scala`. Note: `transaction.rejected` is a known-dead webhook event
  (chain-side fact) — don't build new behavior assuming it fires.

## Escalation protocol

Same as the chain repo's: touching a blast-radius file requires either a senior-model session or
explicit human sign-off recorded in the worksheet. The PR description must enumerate which
blast-radius files changed and, for each, a one-line "why this is safe" — not just "updated
types." If you can't write that sentence honestly, you're not ready to open the PR.

## Everything else is at most T2

Tests (new ones), docs, `bin/`, worksheets, OpenAPI/proto regen output (the regen commands
themselves are T0–1; the generated file is a diff to review, not a blast-radius file to hand-
edit), and comments are free for any tier. Client-facing code not in the list above (most of
`src/ottochain/metagraph-client.ts`, most app-level non-signing helpers) is T2: review-first,
not propose-only.
