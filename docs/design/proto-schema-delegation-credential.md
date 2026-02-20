# Proto Schema Specification: DelegationCredential & CalculatedState

**Status:** Specification — ready for TDD  
**Author:** @think  
**Reviewers:** @research (feasibility ✅), @work (ScalaPB), @code (test author)  
**Card:** [📐 Proto: Define canonical proto schemas](https://trello.com/c/699621e0) — Trello  
**Branch:** `feat/sdk-delegation-methods`

---

## 1. Executive Summary

This spec covers **two surgical proto changes** plus an app-proto audit. Most OttoChain core protos already exist and are correct. The gaps are:

| Gap | Severity | Fix |
|-----|----------|-----|
| `DelegationCredential` proto missing (ordinal-based state layer) | 🔴 Critical | Add to `records.proto` |
| `CalculatedState.delegations` field missing | 🔴 Critical | Add field 3 to `CalculatedState` |
| `delegation.proto` not on `main` (only on feature branch) | 🟡 High | Coordinate PR merge |
| Full app proto audit (identity/governance/contracts/oracles) | 🟡 Medium | Documented in §6 |

Scope **NOT included:** internal fiber engine types (FiberGasConfig, ExecutionLimits, FiberTrigger, etc.) — these are Scala-internal and do not belong in the cross-language proto API.

---

## 2. Context: The Dual-Abstraction Design

OttoChain has **two separate delegation abstractions** — both are correct and intentional:

```
┌─────────────────────────────────────────────────────────────┐
│  API Layer (Human UX)              State Layer (Consensus)   │
│                                                              │
│  Delegation (delegation.proto)     DelegationCredential      │
│  ─────────────────────────         (NEW — records.proto)     │
│  • Wall-clock Timestamps           • Snapshot ordinals       │
│  • Wall-clock created_at/          • createdAtOrdinal        │
│    expires_at for UI display       • expiresAtOrdinal        │
│  • DelegationScope (rich struct)   • scope: List[String]     │
│  • DelegationStatus enum           • isRevoked: Boolean      │
│  • Used in API request/response    • spendUsed tracking      │
│                                    • stakeBonded collateral  │
│                                    • Used in CalculatedState │
│                                      served by ML0 endpoints │
└─────────────────────────────────────────────────────────────┘
```

**Why two?**
- API consumers (TypeScript UIs, external clients) need wall-clock timestamps for human-readable expiry display
- The JLVM and metagraph consensus use ordinals because blocks have ordinals, not timestamps; converting would lose precision and break `DelegationPredicates.notExpired`
- `spendUsed` and `stakeBonded` are runtime tracking state that belongs in `CalculatedState`, not in API request/response objects

---

## 3. Change 1: DelegationCredential Proto Message

### 3.1 Placement Decision

`DelegationCredential` MUST live in **`proto/ottochain/v1/records.proto`** alongside `StateMachineFiberRecord`, `ScriptFiberRecord`, and `CalculatedState`. Rationale:
- `CalculatedState` directly contains a map of these credentials
- All `CalculatedState` component types should be co-located
- Avoids circular import between `records.proto` and `apps/delegation/v1/delegation.proto`

### 3.2 Field Mapping: Scala → Proto

| Scala Field | Scala Type | Proto Field | Proto Type | Notes |
|-------------|-----------|-------------|-----------|-------|
| `delegationId` | `UUID` | `delegation_id` | `string` | UUID as string |
| `delegatorAddr` | `String` | `delegator_address` | `string` | DAG address |
| `relayerAddr` | `String` | `relayer_address` | `string` | DAG address |
| `sessionKey` | `String` | `session_key` | `string` | hex-encoded public key |
| `scope` | `List[String]` | `scope` | `repeated string` | operation names |
| `spendLimit` | `Long` | `spend_limit` | `int64` | base units |
| `spendUsed` | `Long` | `spend_used` | `int64` | running total |
| `createdAtOrdinal` | `Long` | `created_at_ordinal` | `int64` | snapshot ordinal |
| `expiresAtOrdinal` | `Long` | `expires_at_ordinal` | `int64` | snapshot ordinal |
| `stakeBonded` | `Long` | `stake_bonded` | `int64` | base units |
| `isRevoked` | `Boolean` | `is_revoked` | `bool` | explicit revocation |

**Minimum stake bond constant:** `500L` — this is a Scala constant, NOT a proto field. Do not include in proto.

### 3.3 Proto Definition (authoritative)

Add to the **end** of `proto/ottochain/v1/records.proto` (after the existing `CalculatedState` message):

```proto
// DelegationCredential — on-chain state representation of an active session-key delegation.
//
// This is the CONSENSUS/STATE layer representation, distinct from the API-layer
// Delegation message in apps/delegation/v1/delegation.proto.
//
// Key differences from API-layer Delegation:
// - Uses snapshot ordinals (NOT wall-clock Timestamps) for expiry
// - Tracks runtime spend (spend_used, spend_limit)
// - Tracks relayer collateral (stake_bonded)
// - Uses flat scope list (NOT DelegationScope struct)
// - Uses bool is_revoked (NOT DelegationStatus enum)
//
// These differences are intentional: ordinals are canonical in Tessellation
// consensus and required for JLVM guard evaluation.
message DelegationCredential {
  // Unique identifier for this delegation (UUID as string)
  string delegation_id = 1;

  // DAG address of the user who granted this delegation
  string delegator_address = 2;

  // DAG address of the relayer/agent authorized to submit transactions
  string relayer_address = 3;

  // Hex-encoded public key of the session key (compressed secp256k1)
  string session_key = 4;

  // Operations this delegation authorizes (e.g. "market", "contract", "*" for all)
  repeated string scope = 5;

  // Maximum total spending authorized under this delegation (base units)
  int64 spend_limit = 6;

  // Running total of spending consumed (base units). Updated on each delegated tx.
  int64 spend_used = 7;

  // Snapshot ordinal when this delegation was created
  int64 created_at_ordinal = 8;

  // Snapshot ordinal after which this delegation is invalid (exclusive)
  int64 expires_at_ordinal = 9;

  // Amount of stake bonded by the relayer as collateral (base units)
  int64 stake_bonded = 10;

  // Whether this delegation has been explicitly revoked by the delegator
  bool is_revoked = 11;
}
```

---

## 4. Change 2: CalculatedState Update

### 4.1 Field Number Decision

Field 3 for `delegations` is the next available number in `CalculatedState`. It is safe because:
- PR #90 (Scala DelegationCredential) is still in review — no production snapshots contain this field
- Fields 1 and 2 are existing `state_machines` and `scripts`
- No proto wire incompatibility risk

### 4.2 Updated CalculatedState (authoritative diff)

Replace the existing `CalculatedState` message in `proto/ottochain/v1/records.proto`:

```proto
// BEFORE:
message CalculatedState {
  map<string, StateMachineFiberRecord> state_machines = 1;
  map<string, ScriptFiberRecord> scripts = 2;
}

// AFTER:
message CalculatedState {
  // Active state machine fibers, keyed by fiber ID (UUID string)
  map<string, StateMachineFiberRecord> state_machines = 1;

  // Active script oracle fibers, keyed by fiber ID (UUID string)
  map<string, ScriptFiberRecord> scripts = 2;

  // Active delegation credentials, keyed by delegation ID (UUID string).
  // Empty map when no delegations exist (default).
  // Matches Scala: SortedMap[UUID, DelegationCredential]
  map<string, DelegationCredential> delegations = 3;
}
```

---

## 5. TypeScript Interface Equivalents

After proto changes, `ts-proto` should generate types equivalent to these interfaces. These serve as the acceptance criteria for generated type verification:

```typescript
/**
 * DelegationCredential — on-chain state representation.
 * Generated by ts-proto from records.proto; must match this shape.
 *
 * NOTE: distinct from API-layer Delegation in apps/delegation/v1/delegation.proto
 * which uses Timestamps and DelegationScope.
 */
export interface DelegationCredential {
  /** UUID string — unique delegation identifier */
  delegationId: string;

  /** DAG address of delegator (granting party) */
  delegatorAddress: string;

  /** DAG address of relayer/agent (authorized party) */
  relayerAddress: string;

  /** Hex-encoded secp256k1 public key (compressed) */
  sessionKey: string;

  /** Operation names authorized (e.g. ["market", "contract"] or ["*"]) */
  scope: string[];

  /** Maximum authorized spend in base units */
  spendLimit: number;

  /** Running spend total in base units */
  spendUsed: number;

  /** Snapshot ordinal at creation */
  createdAtOrdinal: number;

  /** Snapshot ordinal at expiry (exclusive) */
  expiresAtOrdinal: number;

  /** Relayer collateral in base units */
  stakeBonded: number;

  /** True if explicitly revoked by delegator */
  isRevoked: boolean;
}

/**
 * Updated CalculatedState — adds delegations field.
 */
export interface CalculatedState {
  stateMachines: Record<string, StateMachineFiberRecord>;
  scripts: Record<string, ScriptFiberRecord>;
  /** Keyed by delegation ID (UUID string). Empty object when no delegations. */
  delegations: Record<string, DelegationCredential>;
}
```

**Compatibility note:** The existing hand-written `CalculatedState` in `src/ottochain/types.ts` must be updated to add the `delegations` field, or the generated type will conflict.

---

## 6. App Proto Audit Results

### 6.1 Markets (`apps/markets/v1/market.proto`) — ✅ VERIFIED CORRECT

Spot-checked by @research. Uses `google.protobuf.Timestamp` for market deadlines and order created/updated times. This is **intentional and correct** — market timestamps are human-facing deadline UX, not consensus ordinals.

### 6.2 Identity (`apps/identity/v1/`) — 🔲 NEEDS AUDIT

Files: `agent.proto`, `attestation.proto`  
**TBD by @work during implementation.** Check: do credential expiry fields use ordinals or timestamps?

### 6.3 Governance (`apps/governance/v1/governance.proto`) — 🔲 NEEDS AUDIT

Files: `governance.proto`  
**TBD by @work during implementation.** Check: do proposal voting windows use ordinals or wall-clock time?

### 6.4 Contracts (`apps/contracts/v1/contract.proto`) — 🔲 NEEDS AUDIT

Files: `contract.proto`  
**TBD by @work during implementation.** Check: contract state transitions and time bounds.

### 6.5 Oracles (`apps/oracles/v1/oracle.proto`) — 🔲 NEEDS AUDIT

**TBD by @work during implementation.** Oracles deal with external data — time representation may vary.

**Audit acceptance criterion:** For each app proto, document whether time-related fields use ordinals or Timestamps, and confirm the choice is semantically appropriate.

---

## 7. ScalaPB Configuration Notes

The existing ScalaPB configuration (Done card 69893374 / PR #89) already generates Scala classes from the core protos. Adding `DelegationCredential` to `records.proto` will:

1. Auto-generate `DelegationCredential` Scala case class via ScalaPB
2. This class will NOT automatically satisfy the `DelegationCredential` case class in `xyz.kd5ujc.schema.delegation` — they must be manually reconciled or the Scala hand-written class must be replaced by the generated one

**Key integration requirement:** The generated `DelegationCredential` proto class must eventually replace (or be reconciled with) the hand-written Scala class. This is downstream work for card 699621e1d2651cedf586849f (Migrate: Remove hand-written models module).

For now, the proto definition establishes the canonical field contract that the Scala implementation must match.

---

## 8. PR Merge Order

To avoid integration conflicts, merges should happen in this order:

```
1. PR #90 (feat/jlvm-delegation-operators) — Scala DelegationCredential merged to main
        ↓ confirms Scala wire format is stable
2. This spec's proto changes (feat/sdk-delegation-methods)
        ↓ DelegationCredential proto matches confirmed Scala fields
3. PR #41 (feat/sdk-delegation-methods → main) — delegation.proto + DelegationCredential proto
        ↓ ts-proto can now generate correct TypeScript types
4. Card 699621e1 (ts-proto codegen) — verify generated types
```

If PR #90 merges first and changes DelegationCredential fields, this spec must be updated before #41 merges.

---

## 9. TDD Test Cases

These are the **failing tests @code must write** before any implementation begins:

### 9.1 Proto Definition Tests

```
TEST: DelegationCredential message exists in records.proto
  - Parse records.proto and verify DelegationCredential message is defined
  - Verify all 11 fields are present with correct field numbers (1-11)
  - Verify field types: string (1-4), repeated string (5), int64 (6-10), bool (11)

TEST: CalculatedState has delegations field
  - Parse records.proto and verify CalculatedState has field 3
  - Verify field type is map<string, DelegationCredential>
  - Verify field name is "delegations"
```

### 9.2 Scala Round-Trip Tests

```
TEST: DelegationCredential round-trips through proto serialization
  Given: a Scala DelegationCredential with all fields set
  When: serialized to proto binary and deserialized
  Then: all 11 fields survive the round-trip unchanged

TEST: CalculatedState with delegations serializes correctly
  Given: a CalculatedState with non-empty delegations map
  When: serialized to proto binary and deserialized
  Then: delegations map is preserved with correct DelegationCredential values
  And: state_machines and scripts fields are unaffected

TEST: CalculatedState with empty delegations (default/genesis state)
  Given: a CalculatedState with no delegations (empty map)
  When: serialized and deserialized
  Then: delegations field is empty map (not null/absent)
```

### 9.3 TypeScript Generated Type Tests

```
TEST: ts-proto generates DelegationCredential interface
  Given: proto compiled with ts-proto
  When: TypeScript imports generated types
  Then: DelegationCredential has all 11 expected fields
  And: field types match the TypeScript equivalents in §5

TEST: generated CalculatedState includes delegations
  Given: proto compiled with ts-proto
  When: TypeScript imports CalculatedState
  Then: delegations field exists with type Record<string, DelegationCredential>

TEST: backward compat — existing CalculatedState (no delegations field) deserializes correctly
  Given: a proto binary CalculatedState with only fields 1 and 2 (old format)
  When: deserialized using new CalculatedState proto (with field 3)
  Then: delegations is empty map (proto3 default)
  And: state_machines and scripts are correctly populated
```

### 9.4 JLVM Guard Integration Tests

```
TEST: DelegationCredential isActive() logic matches JLVM delegation.active context var
  Given: a DelegationCredential with isRevoked=false and expiresAtOrdinal=100
  And: current ordinal = 50
  When: JLVM evaluates {"var": "delegation.active"}
  Then: returns true

TEST: DelegationCredential spend tracking
  Given: a DelegationCredential with spendLimit=1000, spendUsed=600
  When: checking canSpend(500)
  Then: returns false (600+500 > 1000)
  And: spendRemaining = 400

TEST: DelegationCredential hasScope() matches JLVM delegation.scope context var
  Given: scope=["market", "contract"]
  When: checking hasScope("market")
  Then: returns true
  When: checking hasScope("governance")
  Then: returns false
  When: scope=["*"] and checking hasScope("anything")
  Then: returns true
```

### 9.5 App Proto Audit Tests

```
TEST: All app/*.proto files parse without errors
  - contracts/v1/contract.proto
  - governance/v1/governance.proto
  - identity/v1/agent.proto
  - identity/v1/attestation.proto
  - oracles/v1/oracle.proto

TEST: Audit document exists at docs/design/proto-schema-delegation-credential.md
  (This file — auto-verified by CI)
```

---

## 10. Acceptance Criteria (for moving to Done)

- [ ] `DelegationCredential` message added to `proto/ottochain/v1/records.proto` with all 11 fields
- [ ] `CalculatedState` in `records.proto` updated with `delegations` field (field number 3)
- [ ] All 9.1 proto definition tests pass
- [ ] All 9.2 Scala round-trip tests pass
- [ ] All 9.3 TypeScript generated type tests pass
- [ ] `src/ottochain/types.ts` `CalculatedState` interface updated to add `delegations` field
- [ ] App proto audit comment added (§6 status updated for identity/governance/contracts/oracles)
- [ ] PR merge order documented in PR description (§8)
- [ ] No regressions in existing proto tests

---

## References

- Scala source: `ottochain/modules/models/src/main/scala/xyz/kd5ujc/schema/delegation/DelegationCredential.scala`
- Proto target: `ottochain-sdk/proto/ottochain/v1/records.proto`
- Delegation API proto: `ottochain-sdk/proto/ottochain/apps/delegation/v1/delegation.proto`
- PR #90: `feat/jlvm-delegation-operators` (Scala DelegationCredential — in review)
- PR #41: `feat/sdk-delegation-methods` (SDK delegation — in review)
- @think requirements analysis: Trello card comment, 2026-02-20 06:55 CST
- @research feasibility assessment: Trello card comment, 2026-02-20 09:07 CST
