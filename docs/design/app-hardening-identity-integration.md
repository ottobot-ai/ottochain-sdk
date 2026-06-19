# App Hardening via Identity Integration + a Map-Write Opcode

**Status:** ratified + partially implemented. Closes the *design-gated* remainder of the FiberEngine ↔
std-app security & alignment audit (`docs/reviews/fiber-app-alignment-audit-2026-06.md`) — the parts the
remediation waves correctly *deferred* because they require protocol/data-model decisions, now decided.

**Implementation status (2026-06):**
- §2 `set`/`unset` opcodes: **published** (metakit-sdk 1.8.0-rc.5) and **consumed** — the SDK is bumped
  to rc.5 and the governance/markets/contracts map-writes are renamed (`getKey`→`get`/`has`,
  `setKey`→`set`, `deleteKey`→`unset`, `size`→`length`/`length[keys]`). The audit's **A2
  `unknown-operator` lint class is now ZERO.**
- §3–§4 identity foundation: **built + validated** — `identity-registry` fiber (reputation + flat
  per-role attestation maps, set/unset writes), the `signerHasReputation` / `signerHasRole` read helpers,
  and the `actorIsSigner` / `actorInSet` / `actorHasEntry` effect-key **coupling** helpers (the S1
  binding that makes a dynamic `event.agent` map key safe). NOTE: roles are **flat per-role maps**, not a
  nested `roles[addr][ROLE]` map — metakit `get`/`has` on a null inner map *throw*, so a nested read
  would error for any unattested signer; flat maps keep read+write total and fail-closed.
- §6 dynamic dependencies (#24): **shipped** (ottochain `feat/fiber-dynamic-dependencies`) — an append-only
  per-fiber dependency ledger mutated by `_addDependency` / `_setDependencyActive`, bounded for DoS, with the
  `machines` context built from `static transition.deps ∪ active dynamic deps`. This retires the static-dep
  workaround: a fiber binds a registry/resolution **instance** at runtime, then reads it.
- §5 per-app **consumption**: **done** — the A3 object-form dependencies are closed via the two-phase
  pattern (`propose_*` binds the resolution fiber via `addDependency`, the gated transition asserts it via
  `depInState`), proven on corp-board and fleeted across corp-securities/entity/shareholders. The SDK ships
  the full consumption toolkit: `depInState`, `addDependency` / `setDependencyActive`, the dynamic
  registry reads `signerHasReputationVia` / `signerHasRoleVia`, plus the `registryReputationPath` /
  `registryRolePath` path-builders. **The whole-repo drift lint is now 0 errors across 23 apps** (both the
  A2 opcode class and the A3 directive class closed).

**Decisions locked (this doc implements them):**
1. **Dicts stay primary.** The map-write gap is fixed with a metakit **opcode**, not an SDK map→array
   refactor. (§2)
2. **Authority & reputation come from the identity sub-system**, cross-referenced via fiber dependencies
   — not per-app invented authority fields. (§3–§5)
3. **Dependencies are static for now**; runtime-updatable (append-only, mark-inactive) deps are queued
   as a separate fiber-engine feature (task #24, §6).

**Two defaults marked `[RATIFY]` for sign-off:** the per-actor reputation source (§4.1) and the
non-reputation role model (§4.2).

---

## 1. What's already fixed vs. what this closes

Already remediated (committed): F1 `===`/`in`/`!==` authz → verified-signer helpers (5 apps); A1
`$timestamp`→`$ordinal` and A4 wire drift (via the #208 merge); corporate A2 opcode/path fixes;
governance S1+A2 *array-case* coupling; lending `_transferAsset`/witness-context; a build-time drift
**lint** (`src/schema/guard-lint.ts`).

This spec closes the rest, all of which need one of the two primitives below:

| Class | Remaining sites | Closed by |
|---|---|---|
| A2 map-WRITES | governance `setKey`/`deleteKey`/Map-`size` (dao-token, dao-multisig, governance-simple) | §2 opcode |
| S1 reputation | dao-reputation `event.agentReputation` | §3 identity read |
| S2 judicial | contract-escrow/agreement, market-prediction (bare `event.judicialRuling`) | §4.2 arbiter role |
| S1/missing-auth | identity-oracle `slash`, corporate issuance/charter/board (`{"==":[1,1]}`) | §4.2 roles |
| A3 dependencies | corporate object-`dependencies`, escrow `spawns` | §5 dependency wiring |

---

## 2. Primitive A — metakit `set`/`unset` opcode  *(HANDOFF to the metakit agent)*

**Problem.** metakit has dynamic-key map **reads** (`get`, `has`) but **no dynamic-key write**. A
computed key cannot even be expressed in the AST (JSON-Logic keys are static strings), so
`{"setKey":[map, {"var":"event.sender"}, v]}` was an author assumption for an opcode that does not exist —
it silently decodes to a literal map and the guard/effect mis-parses. metakit `merge` only takes
static-keyed literals.

**Fix.** Add two opcodes, symmetric with `get`/`has`, **immutable/functional** (return a NEW map),
deterministic, gas-metered:

```
set   [ map, key, value ]   → a copy of `map` with `key` → `value`        (insert or overwrite)
unset [ map, key ]          → a copy of `map` with `key` removed          (no-op if absent)
```

- `key` evaluates to a `StrValue` (the dynamic address/id). Non-string key → JsonLogicError (totality:
  return Left, never throw), like the other ops.
- `map` operand must be a `MapValue`; non-map → JsonLogicError.
- Pure value semantics (no aliasing) so replay is deterministic across Scala/Rust/TS.
- Gas: same shape as `merge` (size-scaled). Implement **byte-for-byte across Scala + Rust + TS** and add
  to the conformance vectors (`zk_opcode_test_vectors.json` sibling for the data ops), exactly as the
  existing map ops were.
- Add `SetOp("set")` / `UnsetOp("unset")` to `JsonLogicOp` + `KNOWN_OPERATORS`; update
  `guard-lint.ts`'s `KNOWN_BAD_OPERATORS` to stop flagging them once published.

**Effect on the SDK:** none structural. The deferred governance map-writes become valid as written —
`{"setKey":...}` → `{"set":[...]}`, `{"deleteKey":...}` → `{"unset":[...]}`, and Map-`size` →
`{"length":[{"keys":[map]}]}`. `votes`/`voters`/`signatures`/`delegations` **stay dicts**. No on-chain
state-shape change. (This is the only metakit change here; the SDK side is a mechanical opcode rename
under #17 once the new metakit version publishes.)

---

## 3. Primitive B — read authority & reputation from the identity sub-system

The engine injects `machines.<depId>.state` for every **declared-dependency** fiber
(`ContextProvider.buildMachinesContext(dependencies)`), and `identity-agent` state already exposes the
right fields: `owner` (immutable address), `reputation` (computed int), `status`, `verified`. So an app
guard reads authority/reputation straight from an identity fiber, **bound to the verified signer**:

```jsonc
// "a verified signer owns identity fiber <idDep> AND that identity's reputation ≥ bar"
{ "and": [
  { "in": [ { "var": "machines.<idDep>.state.owner" }, { "map": [ { "var": "proofs" }, { "var": "address" } ] } ] },
  { ">=": [ { "var": "machines.<idDep>.state.reputation" }, { "var": "state.voteThreshold" } ] }
] }
```

The binding clause (`owner ∈ proofs[].address`) is what makes it safe — you can only invoke authority
for an identity you actually signed for. **Precedent already shipped:** the zk-loan credit-scoring is
literally `creditScore = identity reputation` — this generalizes that pattern to every app.

---

## 4. The authority & reputation model

### 4.1 Reputation source  `[RATIFY]`

`identity-agent.state.reputation` is the canonical reputation. Two read mechanisms by privacy need:

- **Public reputation (recommended default):** declare an **identity-registry / oracle fiber** as a
  static dependency that aggregates `reputations: { <address>: int }`, and read
  `{"get":[{"var":"machines.<registry>.state.reputations"}, <verified-signer-address>]}` — a static dep
  with a dynamic key-read. Works today; no per-voter dependency needed. *(If no such registry fiber
  exists, add one to the identity app — small.)*
- **Private reputation:** the actor carries a signed/zk attestation of their score, verified in-rule —
  the existing `@ottochain/sdk/zk` `reputationCreditRule` (`subject === actor`) pattern.

> `[RATIFY]` use the registry dep for public reputation (dao-reputation), attestation for private. The
> clean long-term form (read each actor's OWN identity fiber directly) needs **dynamic deps (#24)**.

### 4.2 Non-reputation roles — arbiter / slasher / issuer / charter / board  `[RATIFY]`

Model roles as **identity authority attestations** so authority rides the identity sub-system rather than
ad-hoc per-app address fields:

- Add role attestation types to the identity app (e.g. `ARBITER`, `SLASHER`, `ISSUER`, `BOARD_MEMBER`),
  issued by a governing identity/registry. A guard checks "a verified signer holds an active `<ROLE>`
  attestation" via the registry dep + `get`/`has`.
- For a contract instance's *specific* arbiter (not a global role), pin the chosen arbiter's **address**
  into state at dispute-open from the verified signer set, then bind via `proofs[].address` — the
  identity attestation gates *who may be chosen*; the state pin records *who was chosen*.

> `[RATIFY]` role attestations (ecosystem-wide hardening) over a separate governance fiber per role.

---

## 5. Per-app remediation mapping

Each row is a guard rewrite binding to `proofs[].address` and/or `machines.<idDep>.state`, plus a
declared identity/registry **dependency** (the §5-deps wiring is *the same change* as A3 directive
relocation — object-`dependencies` → bare-UUID dep + the `machines.<id>` guard assert):

| App / transition | Finding | Fix |
|---|---|---|
| dao-reputation `propose`/`vote`/`join`/`propose_threshold_change` | S1 `event.agentReputation` | registry dep + `get(reputations, signer)` ≥ threshold; drop the `agentReputation` event field |
| contract-escrow `ruling`/`refund`; contract-agreement `resolve`; market-prediction `ruling`/`finalize` | S2 bare `event.judicialRuling`/`outcome` | `ARBITER`-attested signer (or state-pinned arbiter ∈ proofs); constrain `finalOutcome` to `state.outcomes`/`state.resolutions` |
| identity-oracle `slash` (+ `activate` adminOverride) | missing-auth / S2 | `SLASHER` (or `state.governance`) signer ∈ proofs; delete the `adminOverride` event escape hatch |
| corp-securities (all `{"==":[1,1]}`), corp-entity `amend_charter`/`dissolve`, corp-board `remove_for_cause` | S2 / missing-auth + A3 dropped deps | pin `ISSUER`/`charterAuthority`/`BOARD_MEMBER` (role attestation) signer ∈ proofs; convert object-deps → bare-UUID + assert `machines.<resolution>.currentStateId == "EXECUTED"` |
| governance `dao-token`/`dao-multisig`/`governance-simple` map-writes | A2 | §2 `set`/`unset` opcode rename (no model change) |
| contract-escrow `spawns` Judiciary | A3 | `_spawn` inside the effect with an inline arbiter-fiber definition (its authority is §4.2) |

---

## 6. Dependencies — static now, dynamic later (#24)

For everything above, the identity/registry/resolution fiber is a **static** dependency (declared in the
transition, bare-UUID). That covers fixed authorities and the registry-reputation pattern.

The clean per-actor form (a voter's guard reads *their own* identity fiber) needs **runtime-updatable
dependencies**, queued as task **#24**: model `dependencies` as fiber state (append-only list of
`{fiberId, active, addedAt}`), mutate only via reserved `_addDependency`/`_setDependencyActive` effect
directives (guard-authorized, deterministic), build `machines` from active deps, bounded (active-dep cap
+ cycle-depth cap) for DoS safety. Never remove — mark inactive. This is a fiber-engine change; until it
lands, §4.1's registry pattern stands in.

---

## 7. Sequencing & sign-off

1. **`[RATIFY]`** §4.1 (registry vs attestation) and §4.2 (role attestations) — the only open decisions.
2. **metakit agent**: implement §2 `set`/`unset` + publish (separate effort, in flight).
3. **identity app**: add the reputation **registry** fiber (§4.1) + the role **attestation types** (§4.2).
4. **per-app execution** (unblocks the audit's deferred S1/S2/A3): §5 rows — guard rewrites + identity
   deps. This is mechanical once 1–3 land; resolves the remaining of tasks #17 (map-writes, after the
   opcode), #18 (judicial), #20 (deps), #21 (authority).
5. **fiber-engine**: dynamic deps (#24) as a fast-follow to retire the registry workaround.
6. Tier-iii leftovers unchanged: wire-schema regen + zk public-values action-binding (task #22).

The `guard-lint` (`scripts/lint-apps.mjs`) is the acceptance gate — it must reach **0 errors** across all
apps when this lands, and once `set`/`unset` publish, gets wired into `defineFiberApp` so the drift
classes fail at authoring time (task #23 follow-up).
