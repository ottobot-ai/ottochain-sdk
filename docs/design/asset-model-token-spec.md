# Asset Model: Token State Machine SDK Spec

**Card:** 🔄 Asset Model: DFA + JsonLogic Integration (69893be7)  
**Author:** @work (from @research + @think findings, 2026-02-22)  
**Status:** Specification — TDD-ready, ready for @code test-writing  
**Priority:** Complex, Cross-Repo (ottochain-sdk primary; bridge/indexer secondary)  
**Dependencies:** token-behavior-matrix.md, dfa-json-logic-patterns.md, PR #89 (ts-proto types)

---

## 1. Background

The OttoChain DFA+JLVM engine is **fully live** in Scala:
- `StateMachineDefinition` (states, transitions, guards, effects)
- `FiberRules.L0.transitionExists` — DFA alphabet enforcement
- `FiberEngine` — JLVM guard evaluation + effect application
- `FiberRules.L1.validStateMachineDefinition` — structural validation

**What is missing:** TypeScript SDK utilities for asset-model-specific state machine construction. Developers currently hand-craft raw JSON `StateMachineDefinition` objects, which is error-prone and inconsistent.

**Scope of this card:** Add `src/apps/token/` module to ottochain-sdk, following the established pattern from `src/apps/identity/`, `src/apps/markets/`, `src/apps/governance/`.

---

## 2. Wire Format Constraints (Critical)

⚠️ **All state machine JSON must use the proto-wire format**, not plain TypeScript string values.

```typescript
// ❌ WRONG — plain string (TypeScript type, not wire format)
{ initialState: 'ACTIVE' }

// ✅ CORRECT — proto-wire format (what ML0 accepts)
{ initialState: { value: 'ACTIVE' } }
```

State IDs, from/to fields, and initialState must ALL use `{ value: string }` objects. Guards and effects use JSON Logic directly.

---

## 3. TokenBehavior Type System

### 3.1 Core Types

```typescript
// src/apps/token/types.ts

/** 4-bit integer encoding TDEG: T=bit3, D=bit2, E=bit1, G=bit0 */
export type TokenBehavior = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export const TOKEN_BEHAVIOR_FLAGS = {
  TRANSFERABLE: 0b1000,  // 8
  DIVISIBLE:    0b0100,  // 4
  EXPIRABLE:    0b0010,  // 2
  GOVERNABLE:   0b0001,  // 1
} as const;

/** Named presets for all 16 token types */
export const TOKEN_BEHAVIOR_TYPES: Record<string, TokenBehavior> = {
  // Type 0: Soulbound, whole-unit, permanent, permissionless — credential receipt
  SOULBOUND_RECEIPT:       0,
  // Type 1: Soulbound, whole-unit, permanent, governed — regulated badge
  GOVERNED_BADGE:          1,
  // Type 2: Soulbound, whole-unit, expirable, permissionless — timed credential
  EXPIRABLE_CREDENTIAL:    2,
  // Type 3: Soulbound, whole-unit, expirable, governed — license/permit
  GOVERNED_LICENSE:        3,
  // Type 4: Soulbound, divisible, permanent, permissionless — points/loyalty
  LOYALTY_POINTS:          4,
  // Type 5: Soulbound, divisible, permanent, governed — governed allocation
  GOVERNED_ALLOCATION:     5,
  // Type 6: Soulbound, divisible, expirable, permissionless — time-limited points
  EXPIRABLE_POINTS:        6,
  // Type 7: Soulbound, divisible, expirable, governed — full soulbound stack
  GOVERNED_EXPIRABLE_POINTS: 7,
  // Type 8: Transferable, whole-unit, permanent, permissionless — pure NFT
  NFT:                     8,
  // Type 9: Transferable, whole-unit, permanent, governed — regulated security token
  GOVERNED_NFT:            9,
  // Type 10: Transferable, whole-unit, expirable, permissionless — timed NFT
  EXPIRABLE_NFT:           10,
  // Type 11: Transferable, whole-unit, expirable, governed — expirable regulated NFT
  GOVERNED_EXPIRABLE_NFT:  11,
  // Type 12: Transferable, divisible, permanent, permissionless — fungible token / currency
  FUNGIBLE_TOKEN:          12,
  // Type 13: Transferable, divisible, permanent, governed — stablecoin / security token
  GOVERNED_FUNGIBLE_TOKEN: 13,
  // Type 14: Transferable, divisible, expirable, permissionless — expirable currency
  EXPIRABLE_FUNGIBLE_TOKEN: 14,
  // Type 15: Transferable, divisible, expirable, governed — full feature stack
  GOVERNED_EXPIRABLE_FUNGIBLE: 15,
} as const;
```

### 3.2 Dimension Predicates

```typescript
export function isTransferable(b: TokenBehavior): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.TRANSFERABLE) !== 0;
}
export function isDivisible(b: TokenBehavior): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.DIVISIBLE) !== 0;
}
export function isExpirable(b: TokenBehavior): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.EXPIRABLE) !== 0;
}
export function isGovernable(b: TokenBehavior): boolean {
  return (b & TOKEN_BEHAVIOR_FLAGS.GOVERNABLE) !== 0;
}
export function makeTokenBehavior(t: boolean, d: boolean, e: boolean, g: boolean): TokenBehavior {
  return ((t ? 8 : 0) | (d ? 4 : 0) | (e ? 2 : 0) | (g ? 1 : 0)) as TokenBehavior;
}
```

---

## 4. State Machine Structure

### 4.1 States

All token state machines share a common set of states. Not all states are reachable for every behavior type — but the states are present to make the definition reusable and composable.

```
ACTIVE  — token is live and operations may be submitted
LOCKED  — token temporarily frozen (governance-only feature)
EXPIRED — final: reached when ordinal >= expiresAtOrdinal (expirable tokens only)
BURNED  — final: token destroyed; no further operations accepted
```

**Simplification for non-expirable types:** Tokens where `E=0` will never have a guard that transitions to `EXPIRED`. The state is still present in the definition but unreachable.

### 4.2 Transitions by Dimension

Each transition is a `(from, eventName, guard, effect) → to` tuple.

**Universal (all 16 types):**

| Event | From | To | Guard | Effect |
|-------|------|----|-------|--------|
| `burn` | ACTIVE | BURNED | (none — always legal) | `{ burn: true }` |

**T=1 (Transferable):**

| Event | From | To | Guard | Effect |
|-------|------|----|-------|--------|
| `transfer` | ACTIVE | ACTIVE | not-expired AND (if G=1: validator-approved) | update `holder` to `event.recipient` |

**D=1 (Divisible):**

| Event | From | To | Guard | Effect |
|-------|------|----|-------|--------|
| `split` | ACTIVE | ACTIVE | not-expired AND amount ≤ balance AND amount > 0 | reduce `balance` by `event.amount` (child fiber created externally) |
| `merge` | ACTIVE | ACTIVE | not-expired AND source fiber burned | increase `balance` by `event.amount` |

**E=1 (Expirable) — auto-transition guard:**

| Event | From | To | Guard | Effect |
|-------|------|----|-------|--------|
| `expire` | ACTIVE | EXPIRED | `$ordinal >= state.expiresAtOrdinal` | `{ expired: true }` |

Note: `expire` is a self-service transition — anyone can submit it once the ordinal deadline passes. The guard prevents premature expiry.

**G=1 (Governable) — applied as an additional guard clause on all mutable operations:**

All operations on a governable token check: `{ "var": "delegation.isAuthorized" }` (validator policy context). This is injected by ML0's `ContextProvider.buildDelegationContext()` for whitelisted relayers.

### 4.3 Wire Format Transitions

The `createTokenStateMachine` function builds an array of transition objects in proto-wire format:

```typescript
interface WireTransition {
  from: { value: string };
  to: { value: string };
  eventName: string;
  guard: object | null;
  effect: object | null;
  dependencies?: string[];
}
```

---

## 5. JSON Logic Guards Reference

### 5.1 Expiry Guard (used when E=1)

```json
{ "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
```

**Meaning:** Current snapshot ordinal must be strictly less than the stored expiry ordinal. Used on `transfer`, `split`, `merge` guards.

### 5.2 Governance Guard (used when G=1)

```json
{ "var": "delegation.isAuthorized" }
```

**Meaning:** ML0 JLVM context includes `delegation.isAuthorized` (boolean) from `ContextProvider.buildDelegationContext()`. For non-delegated operations, this may be `false` unless the caller is an owner — implementors should combine with:

```json
{
  "or": [
    { "===": [{ "var": "event.signer" }, { "var": "state.owner" }] },
    { "var": "delegation.isAuthorized" }
  ]
}
```

### 5.3 Divisible Split Guard (D=1)

```json
{
  "and": [
    { ">": [{ "var": "event.amount" }, 0] },
    { "<=": [{ "var": "event.amount" }, { "var": "state.balance" }] }
  ]
}
```

### 5.4 Composite Guard (E=1 + G=1 on transfer)

```json
{
  "and": [
    { "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }] },
    {
      "or": [
        { "===": [{ "var": "event.signer" }, { "var": "state.owner" }] },
        { "var": "delegation.isAuthorized" }
      ]
    }
  ]
}
```

---

## 6. Factory Function API

### 6.1 Primary Factory

```typescript
// src/apps/token/index.ts

/**
 * Generate a token state machine definition for the given behavior type.
 *
 * @param behavior - 4-bit integer (0–15) encoding T/D/E/G flags
 * @returns StateMachineDefinition-compatible JSON in ML0 wire format
 *
 * @example
 * ```typescript
 * import { createTokenStateMachine, TOKEN_BEHAVIOR_TYPES } from '@ottochain/sdk/apps/token';
 *
 * // Create an NFT state machine (T=1, D=0, E=0, G=0 = type 8)
 * const nftDef = createTokenStateMachine(TOKEN_BEHAVIOR_TYPES.NFT);
 *
 * // Create a governed stablecoin (T=1, D=1, E=0, G=1 = type 13)
 * const stablecoinDef = createTokenStateMachine(TOKEN_BEHAVIOR_TYPES.GOVERNED_FUNGIBLE_TOKEN);
 * ```
 */
export function createTokenStateMachine(behavior: TokenBehavior): TokenStateMachineDefinition {
  const transitions: WireTransition[] = buildTransitions(behavior);
  return {
    metadata: {
      name: `Token_${TOKEN_BEHAVIOR_NAMES[behavior] ?? behavior}`,
      description: describeTokenBehavior(behavior),
      version: '1.0.0',
      category: 'asset-model/token',
      tokenBehavior: behavior,
    },
    states: buildStates(behavior),
    initialState: { value: 'ACTIVE' },
    transitions,
  };
}
```

### 6.2 Convenience Preset Getters

```typescript
/** Get state machine definition for a Pure NFT (type 8: T=1, D=0, E=0, G=0) */
export const getNFTDefinition = () => createTokenStateMachine(TOKEN_BEHAVIOR_TYPES.NFT);

/** Get state machine definition for a Fungible Token (type 12: T=1, D=1, E=0, G=0) */
export const getFungibleTokenDefinition = () => createTokenStateMachine(TOKEN_BEHAVIOR_TYPES.FUNGIBLE_TOKEN);

/** Get state machine definition for a Governed Stablecoin (type 13: T=1, D=1, E=0, G=1) */
export const getStablecoinDefinition = () => createTokenStateMachine(TOKEN_BEHAVIOR_TYPES.GOVERNED_FUNGIBLE_TOKEN);

/** Get state machine definition for a License (type 3: T=0, D=0, E=1, G=1) */
export const getLicenseDefinition = () => createTokenStateMachine(TOKEN_BEHAVIOR_TYPES.GOVERNED_LICENSE);

/** Get state machine definition for a Soulbound Badge (type 0: T=0, D=0, E=0, G=0) */
export const getSoulboundBadgeDefinition = () => createTokenStateMachine(TOKEN_BEHAVIOR_TYPES.SOULBOUND_RECEIPT);
```

### 6.3 Type-Safe Event Builders

```typescript
// src/apps/token/events.ts

/** TransitionStateMachine payload for a token transfer */
export interface TransferEvent {
  eventName: 'transfer';
  fiberId: string;
  recipient: string;   // DAG wallet address of new holder
  amount?: number;     // required if D=1 (divisible)
}

/** TransitionStateMachine payload for a token split */
export interface SplitEvent {
  eventName: 'split';
  fiberId: string;
  amount: number;      // amount to split off (must be < current balance)
  childFiberId?: string; // optional: ID to assign to child fiber
}

/** TransitionStateMachine payload for a token merge */
export interface MergeEvent {
  eventName: 'merge';
  fiberId: string;
  sourceFiberId: string; // burned fiber being merged
  amount: number;        // amount being absorbed
}

/** TransitionStateMachine payload for token expiry claim */
export interface ExpireEvent {
  eventName: 'expire';
  fiberId: string;
}

/** TransitionStateMachine payload for token burn */
export interface BurnEvent {
  eventName: 'burn';
  fiberId: string;
}

/** Union of all token events */
export type TokenEvent = TransferEvent | SplitEvent | MergeEvent | ExpireEvent | BurnEvent;

/**
 * Validate that a token event is legal for the given behavior type.
 * Throws if the event is structurally invalid for the token's TDEG flags.
 */
export function validateTokenEvent(event: TokenEvent, behavior: TokenBehavior): void {
  if (event.eventName === 'transfer' && !isTransferable(behavior)) {
    throw new Error(`transfer is illegal for soulbound token (behavior ${behavior})`);
  }
  if ((event.eventName === 'split' || event.eventName === 'merge') && !isDivisible(behavior)) {
    throw new Error(`${event.eventName} is illegal for indivisible token (behavior ${behavior})`);
  }
}
```

---

## 7. Module File Structure

```
src/apps/token/
├── index.ts         — main exports (createTokenStateMachine, presets, re-exports)
├── types.ts         — TokenBehavior, TOKEN_BEHAVIOR_FLAGS, TOKEN_BEHAVIOR_TYPES
├── events.ts        — type-safe event builders + validateTokenEvent
├── builder.ts       — internal: buildTransitions(), buildStates(), buildGuards()
└── constants.ts     — TOKEN_BEHAVIOR_NAMES, describeTokenBehavior()
```

---

## 8. Test Cases (TDD-First — tests must be written BEFORE implementation)

Tests live in `test/apps/token/` in ottochain-sdk or ottochain-services.

### Group 1: TokenBehavior Predicates (5 tests)

```
T1.1: makeTokenBehavior(true, false, false, false) === 8 (NFT)
T1.2: makeTokenBehavior(true, true, false, true) === 13 (stablecoin)
T1.3: isTransferable(8) === true; isTransferable(7) === false
T1.4: isDivisible(4) === true; isDivisible(8) === false
T1.5: isExpirable(2) === true; isGovernable(1) === true
```

### Group 2: State Machine Structure — All 16 Types (16 tests)

For each behavior `b ∈ [0..15]`:
```
T2.b: createTokenStateMachine(b) returns object with:
      - states containing 'ACTIVE' (always present)
      - states containing 'BURNED' (always present, isFinal: true)
      - initialState.value === 'ACTIVE'
      - transitions is array with at least 1 entry (burn always present)
```

### Group 3: Transition Presence by Flag (12 tests)

```
T3.1: behavior=8 (NFT, T=1) → has 'transfer' transition
T3.2: behavior=0 (soulbound, T=0) → no 'transfer' transition
T3.3: behavior=12 (fungible, D=1) → has 'split' transition
T3.4: behavior=12 (fungible, D=1) → has 'merge' transition
T3.5: behavior=8 (NFT, D=0) → no 'split' transition
T3.6: behavior=8 (NFT, D=0) → no 'merge' transition
T3.7: behavior=2 (expirable, E=1) → has 'expire' transition
T3.8: behavior=0 (permanent, E=0) → no 'expire' transition
T3.9: All 16 types → have 'burn' transition (burn is universal)
T3.10: behavior=13 (governed, G=1) → 'transfer' guard contains 'delegation.isAuthorized'
T3.11: behavior=12 (not governed, G=0) → 'transfer' guard does NOT contain 'delegation.isAuthorized'
T3.12: behavior=9 (T=1, G=1, E=0) → 'transfer' guard contains governance check only (no expiry)
```

### Group 4: Wire Format Correctness (6 tests)

```
T4.1: initialState is { value: 'ACTIVE' } not plain string
T4.2: All state IDs are { value: string } not plain strings
T4.3: All transition from/to are { value: string } not plain strings
T4.4: createTokenStateMachine(8).metadata.tokenBehavior === 8
T4.5: Guard for type 10 (E=1, T=1) contains ordinal comparison: { "<": [..., "$ordinal", "state.expiresAtOrdinal"] }
T4.6: Split guard for type 12 (D=1) contains amount <= balance check
```

### Group 5: Event Validators (4 tests)

```
T5.1: validateTokenEvent({eventName:'transfer',...}, behavior=0) → throws (soulbound)
T5.2: validateTokenEvent({eventName:'transfer',...}, behavior=8) → does not throw (NFT)
T5.3: validateTokenEvent({eventName:'split',...}, behavior=8) → throws (indivisible)
T5.4: validateTokenEvent({eventName:'split',...}, behavior=12) → does not throw (divisible)
```

### Group 6: Named Presets (5 tests)

```
T6.1: getNFTDefinition().metadata.tokenBehavior === 8
T6.2: getFungibleTokenDefinition().metadata.tokenBehavior === 12
T6.3: getStablecoinDefinition().metadata.tokenBehavior === 13 — guard has governance check
T6.4: getLicenseDefinition().metadata.tokenBehavior === 3 — is soulbound (no transfer) + expirable
T6.5: TOKEN_BEHAVIOR_TYPES has exactly 16 entries covering all values 0–15
```

**Total: 48 test cases across 6 groups.**

---

## 9. Integration with apps/index.ts

After implementation, add to `src/apps/index.ts`:

```typescript
export * as token from './token/index.js';
```

---

## 10. Implementation Notes

### 10.1 Build Order

1. Write all 48 failing tests first (TDD gate)
2. Implement `types.ts` (TokenBehavior, flags, presets)
3. Implement `builder.ts` (buildTransitions, buildStates, buildGuards)
4. Implement `constants.ts` (names, descriptions)
5. Implement `events.ts` (event types + validation)
6. Implement `index.ts` (exports, factory, presets)
7. Add `token` namespace to `apps/index.ts`
8. Run tests — should all pass

### 10.2 Proto Wire Format

The `StateMachineDefinition` TypeScript type (from PR #89, `generated/`) uses plain strings for state IDs in the TypeScript layer. However, the JSON submitted to ML0 must use proto-wire format `{ value: string }`. The factory function generates JSON targeting the wire format directly — it does NOT use the TypeScript proto types as output (those are for reading, not writing).

### 10.3 Phase 2 (after PR #89 merges)

PR #89 adds generated TypeScript types. When merged, update the factory to:
- Import `StateMachineDefinition` from generated types
- Add `StateMachineDefinition` return type annotation (currently `unknown` like other apps)
- Strict type-checking on the generated output

### 10.4 Overlap with Card 699630154

Card 699630154 ("SDK: DFA state machine engine + JLVM integration") covers engine-level integration. This card is scoped to **asset model consumer utilities** (token-specific factories + templates). Both can proceed in parallel; the boundary is:

- **This card:** Token state machine generation (developer-facing, asset model layer)
- **Card 699630154:** Generic `StateMachineBuilder` class (lower-level, all fiber types)

---

## 11. Acceptance Criteria

- [ ] All 48 tests failing before any implementation code is written
- [ ] All 48 tests passing after implementation
- [ ] `createTokenStateMachine(b)` for all b ∈ [0..15] generates valid ML0-submittable JSON
- [ ] Wire format validated: `{ value: string }` wrappers present throughout
- [ ] Named presets cover all 16 types
- [ ] Event validators prevent structurally invalid operations at TypeScript layer
- [ ] Module added to `src/apps/index.ts` as `token` namespace
- [ ] Round-trip test (optional, E2E): NFT state machine created by factory → submitted to running cluster → ML0 accepts `CreateStateMachine`
