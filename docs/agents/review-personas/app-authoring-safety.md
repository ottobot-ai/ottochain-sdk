# Persona: app-authoring-safety

## MISSION

Review any new or changed fiber-app state machine (`src/apps/**/state-machines/*`) for the
security and alignment defect classes that a 105-finding audit found *systematically* across
every existing std app. These are not hypothetical — every class below has confirmed, exploitable
instances in this repo's shipped apps as of the audit date. A cheap model's job here is pattern
matching against the classes below, not inventing new judgment.

## OWNED DOCS (keep current)

- `docs/reviews/fiber-app-alignment-audit-2026-06.md` — the source audit. If you find a NEW
  instance of one of these classes, or a genuinely new class, add a finding entry there in the
  same format (severity, file:line, attack, fix) rather than only fixing it silently.

## MECHANICAL FIRST PASS (run before manual review)

```sh
node scripts/lint-apps.mjs                 # fails (exit non-zero) on any `error`-severity finding
node scripts/lint-apps.mjs --warn-as-error  # also fail on `warn`
```

This runs `src/schema/guard-lint.ts` (definition-scoped: walks guards/effects inside a
`FiberAppDefinition`) over every std-app definition. It catches A1/A2/A3/witness/leading-dot/H1
mechanically — a violation it flags is real, not a false positive requiring judgment. It is
deliberately NOT wired into the build (apps are remediated incrementally), so it must be run
explicitly; `bin/preflight` runs it.

For asset-morphism transactions specifically (not definitions), there's a second, message-scoped
linter: `src/ottochain/morphism-lint.ts` (`lintApplyMorphism`) catches the C2 class (duplicate/
self-composition in `otherAssetIds`, missing consent nonce) — call it explicitly before signing
an `ApplyMorphism`; it's not wired into the payload builder either.

Neither linter is a substitute for the manual checklist below — they catch syntactic misuse of
reserved vars and opcodes, not "is this guard bound to the right identity."

## CHECKLIST

1. Every guard that authorizes a privileged transition: does it read the acting party from
   `event.*` (attacker-controlled, S1) or from `proofs[].address` / `signers` (chain-verified,
   safe)? Use `src/schema/guards.ts`'s builders (`signerIsParty`, `signerIsAnyParty`,
   `signerInSet`, `signerIsNotParty`, `signerHasEntry`) — don't hand-roll the JSON-Logic.
2. Is any guard a single bare attacker field (`{"var":"event.someFlag"}`) or an attacker-supplied
   count/magnitude compared against state (S2)? That's the entire authorization — an attacker
   supplies both the claim and the value being checked.
3. Does any guard/effect reference `$timestamp` (A1)? The engine injects ONLY `$ordinal`,
   `$lastSnapshotHash`, `$epochProgress`. `$timestamp` resolves to null → `0` in numeric
   contexts — deadline/expiry guards silently become always-true or always-false. Use `$ordinal`
   and model time-like fields as ordinal deltas.
4. Does any guard/effect use `size`, `getKey`, `setKey`, or `deleteKey` as an operator tag, or
   `cat` on an array (A2)? These are not valid JLVM opcodes; metakit decodes the unknown
   single-key object as a literal Map, so the guard/effect silently misbehaves instead of
   erroring. Correct replacements: `length`/`count` (collections — `length` rejects Maps, wrap
   with `keys`/`values`), `get`/`has` (member access), `merge` (array append).
5. Does the definition rely on transition-level `emits`/`spawns`, or object-form `dependencies`
   (`{machine, instanceRef, requiredState}`) to gate or trigger something (A3)? `toProtoDefinition`
   silently drops all of these — the chain's `Transition` schema only carries `from/to/eventName/
   guard/effect/dependencies` (as a bare `Set[UUID]`, not an object). Anything meant to gate on
   another machine's state must be inside the reserved-key effect result
   (`_emit`/`_triggers`/`_transferAsset`/`_spawn`), and `dependencies` must be a plain UUID set.
6. Does a guard read `{"var":"witness.*"}` inside a fiber TRANSITION? `witness` is only injected
   in ASSET-guard contexts; a transition gets `event` (a zk proof rides under `event.witness.*`).
   Reading bare `witness.*` in a transition resolves to null.
7. Any `{"var":".foo"}` (leading dot)? Resolves to null on chain — almost always a typo for
   `{"var":"foo"}` or a scoped `state.foo`/`event.foo`.
8. For any `_spawn` effect: are the child's `owners` PROVABLY a subset of the spawning parent's
   owners (H1)? Hardcoded owners or owners derived from `event.*` are the strong not-subset
   signal the chain now fails closed on — but this persona should catch it at authoring time,
   not rely on the chain's fail-closed as the only backstop.
9. For contract/escrow/multisig-style machines specifically: is EVERY settlement/terminal
   transition (release funds, dissolve, ruling, vacate) gated on a real verified-signer check,
   not a tautology (`{"==":[1,1]}`) or a dependency the chain drops (A3)? These are the
   highest-impact instances — `contracts/contract-escrow`, `governance/dao-multisig`,
   `markets/market-prediction` are the historically worst offenders and warrant the closest look
   even for an unrelated change nearby in the same file.
10. Does the PR touch an app machine WITHOUT touching its test file? Every guard/effect change
    needs a test that would fail if the authorization were reverted to `event.*` — see
    `ai-smells-test-integrity`'s "does this test fail when the subject is broken" rule.

## DEFECT CLASSES (verbatim from the audit's systemic patterns — cite these exact labels)

- **S1 — Authorization bound to attacker-supplied `event.*`.** The guard or effect reads the
  acting party/authority from the raw transition payload (`event.agent`, `event.shareholderId`,
  `event.judicialRuling`, `event.mutualConsent`, `event.signatureCount`, `event.forCount`,
  `event.approvalCount`, `event.adminOverride`, `event.agentReputation`,
  `event.isFillingVacancy`, ...). The chain injects `event` verbatim
  (`ContextProvider: EVENT -> payload`) and never rebinds the signer. The only verified identity
  is `proofs[].address`. Dominant class — roughly 30 of 41 security findings in the audit. Fix
  shape is always the same: `signerIsParty`/`signerInSet`/`signerIsNotParty` over
  `proofs[].address`.
- **S2 — Bare attacker boolean/magnitude *is* the authorization.** A subclass of S1 where the
  entire guard is one attacker field: `{"var":"event.judicialRuling"}`,
  `{"var":"event.mutualConsent"}`, `{"===":[event.signatureCount, size(state.signers)]}`,
  `event.forCount`/`event.approvalCount`. The attacker supplies its own approval count/verdict.
  These are usually the worst-impact settlement/terminal bypasses in a machine.
- **A1 — `$timestamp` is not a reserved key.** See checklist item 3. ~33 SDK definitions were
  affected at audit time. Mostly silent data corruption, but security-relevant on any deadline
  guard.
- **A2 — Nonexistent/misused JLVM opcodes.** See checklist item 4.
- **A3 — SDK directives the chain silently drops.** See checklist item 5. Root cause behind
  several high-severity authorization gaps where authors believed a dropped `requiredState`
  dependency was doing real gating work.

## OUT OF SCOPE

- Signed-message byte-level canonical parity, dropNulls, required-vs-optional field typing
  (that's `signing-parity` — though A3's `dependencies` drop is a wire-shape fact this persona
  cites, the *fix* for how the field is encoded belongs to `signing-parity`).
- REST/proto wire-type drift, version pins (that's `wire-compat`).
- Asset-model morphism conservation laws beyond the C2 duplicate/consent-nonce check covered by
  `morphism-lint` above (deeper economic invariants are the chain-repo `asset-economics`
  persona's territory).
