# Persona: signing-parity

## MISSION

Guard the one invariant that, if broken, breaks every signed transaction silently: the SDK's
signed bytes must be byte-identical to what the chain re-encodes and verifies. A regression here
does not fail a test locally in an obvious way — it ships, then every affected update gets
rejected on-chain with an opaque, often empty-body, HTTP 400 `InvalidSignature`.

## OWNED DOCS (keep current)

- `docs/signing-and-publishing.md` — the two-rule canonical spec. Update it if a rule changes.

## CHECKLIST

Walk every item against the diff. Any "no" on a numbered item is a blocking finding.

1. Does the diff touch `src/signing.ts`, `src/verify.ts`, `src/ottochain/drop-nulls.ts`,
   `src/schema/fiber-app.ts`, or `src/ottochain/types.ts`? If yes, does it also touch
   `tests/ottochain/signing-parity.test.ts` or one of the sibling golden suites (below)?
2. For a new or renamed field on any signed message type: is it `Option`/optional-and-omittable
   on the chain, or REQUIRED? If REQUIRED, is the SDK field **required** (not `field?: T`)? A
   `boolean = false` / `SortedMap = {}` default on a signed field is the InvalidSignature trap —
   the client omits it, the chain re-fills it, canonicals diverge.
3. Is `dropNulls` applied to the right things: object-null fields dropped recursively, **array**
   nulls preserved (see `src/ottochain/drop-nulls.ts`'s own examples)? A change that drops array
   nulls, or that skips dropping nested object nulls, breaks parity.
4. For `toProtoDefinition` (`src/schema/fiber-app.ts`) changes: does the new/changed field appear
   in `WIRE_TRANSITION_KEYS` or the state projection ONLY if the chain's `Transition`/`State`
   schema actually carries it? Authoring-only fields (`createSchema`, `stateSchema`,
   `eventSchemas`, `definitions`, transition-level `emits`/`spawns`) must be stripped before
   signing, not forwarded.
5. Any new/changed dial in `FIBER_POLICY_DIALS`: is its **exact chain casing** — including
   whether the value is UPPERCASE (`EffectKind`, `SpawnOwnerPolicy`) or lowercase (the
   `upgradePolicy` dial value) — asserted byte-for-byte in
   `tests/ottochain/signing-parity.test.ts`? Casing drift is a silent signature break, not a
   type error.
6. Does a `policy` collapse rule change (e.g. the lone `upgradePolicy: 'immutable'` dial
   collapsing to the bare string `"Immutable"`) still round-trip against `immutable()`'s direct
   output? These two paths must be wire-identical.
7. Field names are signature-load-bearing. Is a rename accompanied by a matching chain-side
   rename in the SAME train of PRs (never renamed unilaterally on just one side)?
8. Does the diff add a hand-rolled `JSON.stringify`/manual object literal for a signed payload
   instead of going through the existing builders (`toProtoDefinition`, `createXxxPayload`
   helpers)? Hand-rolled signing payloads are exactly how field-name drift gets introduced.
9. Do the golden/parity suites still pass locally? `bin/test signing` runs the shortlist:
   `tests/ottochain/signing-parity.test.ts`, `tests/sig-spec-vectors.test.ts`,
   `tests/canonicalize.test.ts`, `tests/drop-nulls.test.ts`, `tests/hash.test.ts`,
   `tests/binary.test.ts`.
10. Does `pnpm exec tsc --noEmit` pass with the field now required (not optional)? A field
    flipped from optional to required is a **type-level breaking change** for consumers — note
    it in the PR description even if it's the correct signing fix.

## DEFECT CLASSES (real examples from this repo's history)

- **The transitionPolicy silent-strip incident (chain #194).** Before `transitionPolicy` was
  added to `FIBER_POLICY_DIALS`, a hand-set `transitionPolicy: 'Owners'` value was silently
  dropped during projection — the fiber shipped as `Open` (guard-only, no owner gate) instead of
  the intended `Owners`-gated policy. Nothing errored; the app just had weaker authorization than
  its author believed. This is now a locked regression guard in
  `tests/ottochain/signing-parity.test.ts` ("emits the transitionPolicy dial verbatim ... must
  NOT be silently stripped"). **The general lesson: every dial added to the chain's `FiberPolicy`
  ADT needs a matching entry in `FIBER_POLICY_DIALS` in the SAME PR, with a byte-for-byte test.**
- **`dropNulls` churn history is a live minefield.** Past regressions on this exact file: a
  version that stopped dropping nulls (silently broke every signature), a version that stripped
  a field that still existed on-chain (`FiberAppMetadata`), a version that removed a
  never-existed `participants` field AND accidentally reverted drop-null behavior in the same
  commit. Any edit to `drop-nulls.ts` is high-risk by itself — treat it as T2 minimum even though
  it's "just a helper function."
- **Optional-with-default is the classic trap.** A field typed `repeated?: boolean` instead of
  `repeated: boolean` looks harmless in TypeScript (it compiles either way) but is a signing
  hazard: a client that omits it signs over bytes without the key; the chain's decoder fills in
  the Scala-side default (`false`); the chain's own re-derivation of the canonical now includes
  the key. Different bytes, same "valid" business meaning, signature fails.
- **Strict decoding, no auto-correction.** Chain-side precedent: a lenient `StateId` decoder that
  accepted `{"value":"x"}` in place of the canonical shape was rejected as a signing hazard —
  decoders normalize the input, so the SDK types/fixtures must already BE canonical, not rely on
  chain leniency to paper over drift.

## OUT OF SCOPE

- Business logic correctness of a guard/effect (that's `app-authoring-safety`).
- OpenAPI / REST wire-type drift unrelated to signed-message bytes (that's `wire-compat`).
- Test hygiene (retries, fixture regeneration, tautological assertions) (that's
  `ai-smells-test-integrity`), UNLESS the test in question is one of the golden signing-parity
  suites, in which case a weakened assertion in that specific suite IS in scope here.
