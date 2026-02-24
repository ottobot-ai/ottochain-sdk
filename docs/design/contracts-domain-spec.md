# Contracts Domain: Complete Stack Integration Specification

**Status:** Draft  
**Author:** @think (OttoBot)  
**Date:** 2026-02-24  
**Trello Card:** [Contracts Domain: Complete Stack Integration](https://trello.com/c/6995f770539fae52d0916864)  
**Feasibility Rating:** MEDIUM

## Overview

This specification defines the TDD implementation plan for completing the Contracts Domain stack integration across ottochain-sdk, ottochain-services, and the metagraph. The work addresses four key gaps identified during feasibility analysis.

## Problem Statement

The current Contracts domain has partial implementations that don't align with the metagraph's fiber processing engine:

1. **$timestamp misuse**: JSON state machines use `{"var": "$timestamp"}` which doesn't exist in the metagraph context
2. **emits/spawns ignored**: Sibling-level `emits`/`spawns` keys are silently ignored by ExpressionParser
3. **Missing bridge routes**: No `escrow.ts` routes in the bridge service
4. **Missing SDK constants**: No `CONTRACT_TRANSITIONS` or `ESCROW_TRANSITIONS` constants for SDK consumers

## Key Findings from @research

| Issue | Occurrences | Impact |
|-------|-------------|--------|
| `$timestamp` → `sequenceNumber` | 17 (7 contract, 10 escrow) | Effects fail silently at runtime |
| `emits`/`spawns` as siblings | 1 escrow transition | Judiciary spawn never fires |
| Missing escrow routes | N/A | Bridge can't handle escrow operations |
| Missing constants | N/A | SDK consumers can't validate transitions |

## Acceptance Criteria

### AC1: $timestamp → sequenceNumber Migration
All occurrences of `{"var": "$timestamp"}` MUST be replaced with `{"var": "sequenceNumber"}`.

**Rationale:** The metagraph exposes `sequenceNumber` in the fiber context (see `ReservedKeys.SEQUENCE_NUMBER`), not `$timestamp`. Using the wrong variable causes effects to evaluate to `null`.

**Files affected:**
- `src/apps/contracts/state-machines/contract.json` (7 occurrences)
- `src/apps/contracts/state-machines/escrow.json` (10 occurrences)

### AC2: emits/spawns Restructuring
Transitions with side effects MUST use `_emit`/`_spawn` keys INSIDE the effect result, not as sibling keys.

**Current (broken):**
```json
{
  "eventName": "dispute",
  "effect": { "merge": [...] },
  "spawns": {
    "sm": "Judiciary",
    "initialData": {...}
  }
}
```

**Required (working):**
```json
{
  "eventName": "dispute",
  "effect": {
    "merge": [
      { "var": "state" },
      {
        "status": "DISPUTED",
        "_spawn": {
          "definition": "Judiciary",
          "initialData": {...}
        }
      }
    ]
  }
}
```

**Files affected:**
- `src/apps/contracts/state-machines/escrow.json` (dispute transition)

### AC3: Escrow Bridge Routes
Create `escrow.ts` in bridge with full CRUD operations mirroring `contract.ts` pattern.

**Required routes:**
- `POST /escrow/create` - Create new escrow
- `POST /escrow/deposit` - Fund escrow
- `POST /escrow/activate` - Activate funded escrow
- `POST /escrow/release` - Release to beneficiary
- `POST /escrow/refund` - Refund to depositor
- `POST /escrow/dispute` - Initiate dispute (spawns Judiciary)
- `POST /escrow/split` - Split funds (arbitration outcome)
- `GET /escrow/:id` - Get escrow state
- `GET /escrow/by-contract/:contractId` - Get escrow by linked contract

**Files to create:**
- `ottochain-services/src/bridge/routes/escrow.ts`

**Files to update:**
- `ottochain-services/src/bridge/index.ts` (register routes)

### AC4: SDK Constants
Add transition constants and validation helpers for Contracts domain.

**Files to create:**
- `src/apps/contracts/constants.ts`

**Required exports:**
```typescript
export const CONTRACT_TRANSITIONS: Record<ContractState, readonly string[]>;
export const ESCROW_TRANSITIONS: Record<EscrowState, readonly string[]>;
export function canContractTransition(state: ContractState, event: string): boolean;
export function canEscrowTransition(state: EscrowState, event: string): boolean;
```

### AC5: Traffic Generator Alignment
Traffic generator fixtures remain intentionally separate from SDK domain models. Document this decision.

**Action:** Add comment in traffic-gen explaining the separation rationale.

## Test-Driven Development Plan

### SDK Tests (ottochain-sdk)

#### Test Group 1: JSON State Machine Validity (8 tests)
| Test ID | Description | Status |
|---------|-------------|--------|
| SDK-SM-01 | contract.json parses without error | 🔴 Failing |
| SDK-SM-02 | contract.json has no $timestamp references | 🔴 Failing |
| SDK-SM-03 | escrow.json parses without error | 🔴 Failing |
| SDK-SM-04 | escrow.json has no $timestamp references | 🔴 Failing |
| SDK-SM-05 | escrow.json spawns use _spawn inside effect | 🔴 Failing |
| SDK-SM-06 | contract transitions match CONTRACT_TRANSITIONS | 🔴 Failing |
| SDK-SM-07 | escrow transitions match ESCROW_TRANSITIONS | 🔴 Failing |
| SDK-SM-08 | All state machine files export valid JSON | 🔴 Failing |

#### Test Group 2: SDK Constants (6 tests)
| Test ID | Description | Status |
|---------|-------------|--------|
| SDK-CONST-01 | CONTRACT_TRANSITIONS covers all ContractState values | 🔴 Failing |
| SDK-CONST-02 | ESCROW_TRANSITIONS covers all EscrowState values | 🔴 Failing |
| SDK-CONST-03 | canContractTransition returns true for valid transitions | 🔴 Failing |
| SDK-CONST-04 | canContractTransition returns false for invalid transitions | 🔴 Failing |
| SDK-CONST-05 | canEscrowTransition returns true for valid transitions | 🔴 Failing |
| SDK-CONST-06 | canEscrowTransition returns false for invalid transitions | 🔴 Failing |

### Services Tests (ottochain-services)

#### Test Group 3: Bridge Escrow Routes (10 tests)
| Test ID | Description | Status |
|---------|-------------|--------|
| SVC-ESC-01 | POST /escrow/create returns 201 with valid payload | 🔴 Failing |
| SVC-ESC-02 | POST /escrow/deposit returns 200 for CREATED escrow | 🔴 Failing |
| SVC-ESC-03 | POST /escrow/deposit rejects non-CREATED escrow | 🔴 Failing |
| SVC-ESC-04 | POST /escrow/activate returns 200 for FUNDED escrow | 🔴 Failing |
| SVC-ESC-05 | POST /escrow/release returns 200 for ACTIVE escrow | 🔴 Failing |
| SVC-ESC-06 | POST /escrow/refund returns 200 for ACTIVE escrow | 🔴 Failing |
| SVC-ESC-07 | POST /escrow/dispute spawns Judiciary fiber | 🔴 Failing |
| SVC-ESC-08 | POST /escrow/split returns 200 for DISPUTED escrow | 🔴 Failing |
| SVC-ESC-09 | GET /escrow/:id returns escrow state | 🔴 Failing |
| SVC-ESC-10 | GET /escrow/by-contract/:contractId returns linked escrow | 🔴 Failing |

#### Test Group 4: Integration Tests (4 tests)
| Test ID | Description | Status |
|---------|-------------|--------|
| INT-01 | Contract accept updates acceptedAt with sequenceNumber | 🔴 Failing |
| INT-02 | Escrow deposit updates fundedAt with sequenceNumber | 🔴 Failing |
| INT-03 | Escrow dispute spawns Judiciary with correct initialData | 🔴 Failing |
| INT-04 | Full contract→escrow→dispute→resolution flow | 🔴 Failing |

### Summary: 28 Total Tests

| Repo | Test Group | Count |
|------|------------|-------|
| ottochain-sdk | SM Validity | 8 |
| ottochain-sdk | Constants | 6 |
| ottochain-services | Bridge Routes | 10 |
| ottochain-services | Integration | 4 |
| **Total** | | **28** |

## Cross-Repository Inventory

### ottochain-sdk (8 files)

| File | Action | Changes |
|------|--------|---------|
| `src/apps/contracts/state-machines/contract.json` | Modify | Replace 7 `$timestamp` → `sequenceNumber` |
| `src/apps/contracts/state-machines/escrow.json` | Modify | Replace 10 `$timestamp` → `sequenceNumber`, restructure `spawns` → `_spawn` |
| `src/apps/contracts/constants.ts` | Create | Add CONTRACT_TRANSITIONS, ESCROW_TRANSITIONS, validation helpers |
| `src/apps/contracts/index.ts` | Modify | Export constants |
| `tests/contracts/state-machines.test.ts` | Create | SDK-SM-* tests |
| `tests/contracts/constants.test.ts` | Create | SDK-CONST-* tests |

### ottochain-services (4 files)

| File | Action | Changes |
|------|--------|---------|
| `src/bridge/routes/escrow.ts` | Create | Full escrow route handlers |
| `src/bridge/index.ts` | Modify | Register escrow routes |
| `tests/bridge/escrow.test.ts` | Create | SVC-ESC-* tests |
| `tests/integration/contracts.test.ts` | Create | INT-* tests |

### ottochain (Scala metagraph) (0 files)

No changes required. The metagraph already supports `sequenceNumber` context variable and `_spawn` effect extraction.

## Implementation Order

1. **Phase 1: SDK State Machine Fixes** (AC1, AC2)
   - Fix $timestamp → sequenceNumber
   - Restructure spawns → _spawn
   - Add state machine tests

2. **Phase 2: SDK Constants** (AC4)
   - Create constants.ts
   - Add transition validation helpers
   - Add constants tests

3. **Phase 3: Bridge Escrow Routes** (AC3)
   - Create escrow.ts routes
   - Register in bridge index
   - Add route tests

4. **Phase 4: Integration Tests** (AC3)
   - Add E2E integration tests
   - Verify full flow with metagraph

5. **Phase 5: Documentation** (AC5)
   - Update traffic-gen comments
   - Update SDK documentation

## Migration Notes

### $timestamp → sequenceNumber

The metagraph provides these context variables (from `ReservedKeys.scala`):

```scala
val SEQUENCE_NUMBER = "sequenceNumber"  // ✅ Use this
val ORDINAL = "$ordinal"                // For deadline comparisons
val LAST_SNAPSHOT_HASH = "$lastSnapshotHash"  // For randomness
val EPOCH_PROGRESS = "$epochProgress"   // For epoch-based logic
```

`$timestamp` was never a valid context variable. Effects using it evaluate the timestamp field to `null`, causing silent data loss.

### _spawn Inside Effect

The EffectExtractor looks for reserved keys INSIDE the effect result:

```scala
private def extractByKey(effectResult: JsonLogicValue, key: String): Option[JsonLogicValue] =
  effectResult match {
    case MapValue(map) => map.get(key)  // Looks inside the map
    // ...
  }
```

Keys at the transition level (siblings to `effect`) are ignored during transition parsing.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing contract fibers | Low | High | Migrations only affect JSON definitions, not stored state |
| Judiciary spawn schema mismatch | Medium | Medium | Verify Judiciary SM exists and accepts initialData format |
| Bridge route authentication | Low | Medium | Follow existing contract.ts auth patterns |

## References

- [ReservedKeys.scala](https://github.com/scasplte2/ottochain/blob/main/modules/models/src/main/scala/xyz/kd5ujc/schema/fiber/ReservedKeys.scala)
- [EffectExtractor.scala](https://github.com/scasplte2/ottochain/blob/main/modules/shared-data/src/main/scala/xyz/kd5ujc/shared_data/fiber/evaluation/EffectExtractor.scala)
- [ExpressionParser.scala](https://github.com/scasplte2/ottochain/blob/main/modules/shared-data/src/main/scala/xyz/kd5ujc/shared_data/fiber/evaluation/ExpressionParser.scala)
- [Identity Domain Spec PR #54](https://github.com/scasplte2/ottochain-services/pull/54) (reference pattern)

---

*Generated by @think — OttoBot Planning Agent*
