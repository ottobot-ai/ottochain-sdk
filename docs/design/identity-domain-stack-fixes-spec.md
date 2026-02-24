# Identity Domain: Complete Stack Integration Spec

**Status:** TDD-Ready Specification  
**Author:** @think  
**Date:** 2026-02-24  
**Trello Card:** [🆔 Identity Domain: Complete Stack Integration](https://trello.com/c/6995f76a1ba57bea0302baa1)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Phase 1: Event Name Alignment](#3-phase-1-event-name-alignment)
4. [Phase 1: $timestamp Fix](#4-phase-1-timestamp-fix)
5. [Phase 1: AGENT_TRANSITIONS Update](#5-phase-1-agent_transitions-update)
6. [Phase 1: receive_violation Transition](#6-phase-1-receive_violation-transition)
7. [Phase 2: Challenge Auth Guard (Deferred)](#7-phase-2-challenge-auth-guard-deferred)
8. [Cross-Repository Scope](#8-cross-repository-scope)
9. [TDD Test Cases](#9-tdd-test-cases)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Executive Summary

The Identity Domain stack is structurally complete (proto, SDK, bridge, explorer, gateway, indexer all exist) but **broken by event name mismatches** between traffic-gen and the state machine, plus several other issues:

| Issue | Impact | Fix |
|-------|--------|-----|
| Event name mismatch (4 events) | All identity transitions fail | Align traffic-gen to state machine events |
| `$timestamp` in 3 effects | JLVM runtime error (undefined var) | Replace with `sequenceNumber` |
| `AGENT_TRANSITIONS` missing 3 events | SDK validation rejects valid transitions | Add `receive_vouch`, `receive_completion`, `receive_violation` |
| `receive_violation` missing from SM | Cannot record violations | Add ACTIVE→ACTIVE self-loop |
| Challenge auth (signer ≠ owner) | Anyone can challenge (unintended) | Phase 2: blocked on multi-party signing |

**Scope:** Cross-repo (ottochain-sdk + ottochain-services). Phase 1 is fully unblocked. Phase 2 requires [A3] Multi-Party Transition Signing.

---

## 2. Problem Statement

### 2.1 Current State

Traffic-gen sends events that **do not match** the state machine definition:

| Traffic-Gen Event | State Machine Event | Result |
|-------------------|---------------------|--------|
| `submit_attestation` | `receive_vouch` OR `receive_completion` | ❌ Rejected |
| `submit_violation` | *(missing)* | ❌ Rejected |
| `file_challenge` | `challenge` | ❌ Rejected |
| `withdraw` | `withdraw` | ✅ Works |

### 2.2 Root Cause Analysis

1. **Design mismatch:** Traffic-gen was written with an "action-oriented" naming (`submit_*`, `file_*`) while the state machine uses "event-oriented" naming (`receive_*`, `challenge`).

2. **Missing transition:** The `receive_violation` event doesn't exist in the state machine, so there's no way to record violations.

3. **$timestamp undefined:** JLVM context does NOT include `$timestamp` or `$epochProgress`. Available context variables (from `ContextProvider.scala`):
   - `state`, `event`, `eventName`, `machineId`, `currentStateId`
   - `sequenceNumber`, `proofs`, `machines`, `parent`, `children`, `scripts`

4. **SDK desync:** `AGENT_TRANSITIONS` in `constants.ts` doesn't list the self-loop events (`receive_vouch`, `receive_completion`), causing SDK-side validation failures.

---

## 3. Phase 1: Event Name Alignment

### 3.1 Decision: Align Traffic-Gen to State Machine

**Why:** The state machine event names are more semantically correct:
- `receive_vouch` describes what the agent **receives**, not what another agent submits
- This matches the metagraph's event-sourcing model (events are things that happen TO a fiber)

### 3.2 Traffic-Gen Changes

**File:** `ottochain-services/packages/traffic-generator/src/simulator.ts`

**Before:**
```typescript
case AgentState.AGENT_STATE_ACTIVE:
  return ['submit_attestation', 'submit_violation', 'file_challenge', 'withdraw'];
```

**After:**
```typescript
case AgentState.AGENT_STATE_ACTIVE:
  return ['receive_vouch', 'receive_completion', 'receive_violation', 'challenge', 'withdraw'];
```

**File:** `ottochain-services/packages/traffic-generator/src/selection.ts`

**Before:**
```typescript
// Agent identity events
submit_attestation: 0.7,
submit_violation: 0.1 + riskTolerance * 0.3,
file_challenge: 0.05 + riskTolerance * 0.2,
```

**After:**
```typescript
// Agent identity events
receive_vouch: 0.5,           // Positive attestation
receive_completion: 0.2,      // Task completion attestation
receive_violation: 0.1 + riskTolerance * 0.3, // Risky agents more likely
challenge: 0.05 + riskTolerance * 0.2,
```

**File:** `ottochain-services/packages/traffic-generator/src/workflows.ts`

**Before:**
```typescript
{ from: 'ACTIVE', to: 'CHALLENGED', event: 'file_challenge', actor: 'third_party', weight: 0.05 },
```

**After:**
```typescript
{ from: 'ACTIVE', to: 'CHALLENGED', event: 'challenge', actor: 'third_party', weight: 0.05 },
```

### 3.3 Event Mapping Table

| Old Event (traffic-gen) | New Event (aligned) | State Machine Transition |
|------------------------|---------------------|--------------------------|
| `submit_attestation` | `receive_vouch` | ACTIVE → ACTIVE (+2 rep) |
| `submit_attestation` | `receive_completion` | ACTIVE → ACTIVE (+5 rep) |
| `submit_violation` | `receive_violation` | ACTIVE → ACTIVE (-10 rep) |
| `file_challenge` | `challenge` | ACTIVE → CHALLENGED |

---

## 4. Phase 1: $timestamp Fix

### 4.1 Problem

Three state machine effects use `{"var": "$timestamp"}` which doesn't exist in JLVM context:

```json
"effect": {
  "merge": [
    {"var": "state"},
    {"activatedAt": {"var": "$timestamp"}}  // ❌ UNDEFINED
  ]
}
```

### 4.2 Solution: Use sequenceNumber

Replace `$timestamp` with `sequenceNumber` (available in JLVM context). This provides:
- **Monotonicity:** Always increasing
- **Causality:** Reflects the order of events on-chain
- **No Scala changes required**

### 4.3 Exact JSON Patches

**File:** `ottochain-sdk/src/apps/identity/state-machines/agent-identity.json`

#### 4.3.1 activate transition (REGISTERED → ACTIVE)

**Before:**
```json
{
  "from": {"value": "REGISTERED"},
  "to": {"value": "ACTIVE"},
  "eventName": "activate",
  "effect": {
    "merge": [
      {"var": "state"},
      {
        "status": "ACTIVE",
        "activatedAt": {"var": "$timestamp"}
      }
    ]
  }
}
```

**After:**
```json
{
  "from": {"value": "REGISTERED"},
  "to": {"value": "ACTIVE"},
  "eventName": "activate",
  "effect": {
    "merge": [
      {"var": "state"},
      {
        "status": "ACTIVE",
        "activatedAt": {"var": "sequenceNumber"}
      }
    ]
  }
}
```

#### 4.3.2 uphold_challenge transition (CHALLENGED → SUSPENDED)

**Before:**
```json
{
  "from": {"value": "CHALLENGED"},
  "to": {"value": "SUSPENDED"},
  "eventName": "uphold_challenge",
  "effect": {
    "merge": [
      {"var": "state"},
      {
        "status": "SUSPENDED",
        "suspendedAt": {"var": "$timestamp"}
      }
    ]
  }
}
```

**After:**
```json
{
  "from": {"value": "CHALLENGED"},
  "to": {"value": "SUSPENDED"},
  "eventName": "uphold_challenge",
  "effect": {
    "merge": [
      {"var": "state"},
      {
        "status": "SUSPENDED",
        "suspendedAt": {"var": "sequenceNumber"}
      }
    ]
  }
}
```

#### 4.3.3 begin_probation transition (SUSPENDED → PROBATION)

**Before:**
```json
{
  "from": {"value": "SUSPENDED"},
  "to": {"value": "PROBATION"},
  "eventName": "begin_probation",
  "effect": {
    "merge": [
      {"var": "state"},
      {
        "status": "PROBATION",
        "probationStartedAt": {"var": "$timestamp"}
      }
    ]
  }
}
```

**After:**
```json
{
  "from": {"value": "SUSPENDED"},
  "to": {"value": "PROBATION"},
  "eventName": "begin_probation",
  "effect": {
    "merge": [
      {"var": "state"},
      {
        "status": "PROBATION",
        "probationStartedAt": {"var": "sequenceNumber"}
      }
    ]
  }
}
```

---

## 5. Phase 1: AGENT_TRANSITIONS Update

### 5.1 Problem

`AGENT_TRANSITIONS` in `constants.ts` doesn't include the self-loop events for ACTIVE state:

**Current:**
```typescript
[AgentState.AGENT_STATE_ACTIVE]: ['challenge', 'withdraw'],
```

This causes SDK-side validation to reject valid transitions like `receive_vouch`.

### 5.2 Solution

**File:** `ottochain-sdk/src/apps/identity/constants.ts`

**Before:**
```typescript
export const AGENT_TRANSITIONS: Record<AgentState, readonly string[]> = {
  [AgentState.AGENT_STATE_UNSPECIFIED]: [],
  [AgentState.AGENT_STATE_REGISTERED]: ['activate', 'withdraw'],
  [AgentState.AGENT_STATE_ACTIVE]: ['challenge', 'withdraw'],
  [AgentState.AGENT_STATE_CHALLENGED]: ['uphold_challenge', 'dismiss_challenge'],
  [AgentState.AGENT_STATE_SUSPENDED]: ['begin_probation'],
  [AgentState.AGENT_STATE_PROBATION]: ['complete_probation'],
  [AgentState.AGENT_STATE_WITHDRAWN]: [],
  [AgentState.UNRECOGNIZED]: [],
};
```

**After:**
```typescript
export const AGENT_TRANSITIONS: Record<AgentState, readonly string[]> = {
  [AgentState.AGENT_STATE_UNSPECIFIED]: [],
  [AgentState.AGENT_STATE_REGISTERED]: ['activate', 'withdraw'],
  [AgentState.AGENT_STATE_ACTIVE]: [
    'receive_vouch',        // Self-loop: receive vouch attestation (+2 rep)
    'receive_completion',   // Self-loop: receive task completion attestation (+5 rep)
    'receive_violation',    // Self-loop: receive violation report (-10 rep)
    'challenge',            // Transition to CHALLENGED state
    'withdraw',             // Transition to WITHDRAWN state
  ],
  [AgentState.AGENT_STATE_CHALLENGED]: ['uphold_challenge', 'dismiss_challenge'],
  [AgentState.AGENT_STATE_SUSPENDED]: ['begin_probation'],
  [AgentState.AGENT_STATE_PROBATION]: ['complete_probation'],
  [AgentState.AGENT_STATE_WITHDRAWN]: [],
  [AgentState.UNRECOGNIZED]: [],
};
```

---

## 6. Phase 1: receive_violation Transition

### 6.1 Problem

The state machine has no way to record violations. Traffic-gen sends `submit_violation` which doesn't match any transition.

### 6.2 Solution: ACTIVE→ACTIVE Self-Loop

Add a new transition to record violations with reputation penalty.

**File:** `ottochain-sdk/src/apps/identity/state-machines/agent-identity.json`

**Add to `transitions` array:**
```json
{
  "from": {"value": "ACTIVE"},
  "to": {"value": "ACTIVE"},
  "eventName": "receive_violation",
  "guard": {
    "!!": [{"var": "event.reporter"}]
  },
  "effect": {
    "merge": [
      {"var": "state"},
      {
        "reputation": {
          "+": [
            {"var": "state.reputation"},
            -10
          ]
        },
        "violations": {
          "+": [
            {"if": [{"var": "state.violations"}, {"var": "state.violations"}, 0]},
            1
          ]
        },
        "lastViolationAt": {"var": "sequenceNumber"}
      }
    ]
  },
  "dependencies": []
}
```

### 6.3 StateData Schema Update

The `receive_violation` effect adds new fields to stateData:
- `violations: number` — count of violations received
- `lastViolationAt: number` — sequenceNumber of last violation

Ensure initial stateData includes:
```json
{
  "reputation": 10,
  "violations": 0
}
```

---

## 7. Phase 2: Challenge Auth Guard (Deferred)

### 7.1 Problem

Currently, the `challenge` transition has a trivial guard:
```json
"guard": {"!!": [{"var": "event.challenger"}]}
```

This allows **anyone** to challenge, including the fiber owner challenging themselves.

### 7.2 Desired Behavior

Only third parties (non-owners) should be able to challenge an agent. The guard should be:
```json
"guard": {
  "and": [
    {"!!": [{"var": "event.challenger"}]},
    {"!=": [{"var": "proofs.0.address"}, {"var": "owner"}]}
  ]
}
```

### 7.3 Blocker: Multi-Party Signing

**This is BLOCKED** on [A3] Implement: Multi-Party Transition Signing (card 699ce210).

**Why:** Currently, `FiberRules.L0.updateSignedByOwners` rejects ALL transitions not signed by the fiber owner. Even if we add the guard, third-party challenges would be rejected at the ML0 validation layer before reaching the guard.

After A3 merges:
1. `authorizedSigners` will allow non-owner signers for specific transitions
2. The state machine can define which transitions accept third-party signers
3. The guard can then enforce `signer ≠ owner`

### 7.4 Phase 2 Implementation (Post-A3)

When A3 is complete:

1. **Update CreateStateMachine** to include challenge as a third-party-allowed transition:
   ```json
   {
     "thirdPartyTransitions": ["challenge"]
   }
   ```

2. **Update challenge guard:**
   ```json
   {
     "from": {"value": "ACTIVE"},
     "to": {"value": "CHALLENGED"},
     "eventName": "challenge",
     "guard": {
       "and": [
         {"!!": [{"var": "event.challenger"}]},
         {"!=": [
           {"var": "proofs.0.address"},
           {"var": "machines.self.owners.0"}
         ]}
       ]
     }
   }
   ```

---

## 8. Cross-Repository Scope

### 8.1 ottochain-sdk

| File | Change |
|------|--------|
| `src/apps/identity/state-machines/agent-identity.json` | Fix $timestamp (3 effects), add receive_violation transition |
| `src/apps/identity/constants.ts` | Add 3 missing events to AGENT_TRANSITIONS |

### 8.2 ottochain-services

| File | Change |
|------|--------|
| `packages/traffic-generator/src/simulator.ts` | Rename events in getAvailableAgentEvents() |
| `packages/traffic-generator/src/selection.ts` | Rename events in probability weights |
| `packages/traffic-generator/src/workflows.ts` | Rename file_challenge → challenge |

### 8.3 Optional: Bridge (agent.ts)

If the bridge has any identity-specific event validation, it may need updating. Initial audit suggests bridge is event-agnostic for state machine transitions.

---

## 9. TDD Test Cases

### 9.1 State Machine Definition Tests (SDK)

**File:** `src/apps/identity/__tests__/agent-identity-state-machine.test.ts`

```typescript
describe('AgentIdentity State Machine Definition', () => {
  // T1: $timestamp replacement
  describe('$timestamp fixes', () => {
    it('T1.1: activate effect uses sequenceNumber not $timestamp', () => {
      const transition = getTransition('activate');
      expect(JSON.stringify(transition.effect)).not.toContain('$timestamp');
      expect(JSON.stringify(transition.effect)).toContain('sequenceNumber');
    });

    it('T1.2: uphold_challenge effect uses sequenceNumber not $timestamp', () => {
      const transition = getTransition('uphold_challenge');
      expect(JSON.stringify(transition.effect)).not.toContain('$timestamp');
      expect(JSON.stringify(transition.effect)).toContain('sequenceNumber');
    });

    it('T1.3: begin_probation effect uses sequenceNumber not $timestamp', () => {
      const transition = getTransition('begin_probation');
      expect(JSON.stringify(transition.effect)).not.toContain('$timestamp');
      expect(JSON.stringify(transition.effect)).toContain('sequenceNumber');
    });
  });

  // T2: receive_violation transition exists
  describe('receive_violation transition', () => {
    it('T2.1: receive_violation transition exists', () => {
      const transition = getTransition('receive_violation');
      expect(transition).toBeDefined();
    });

    it('T2.2: receive_violation is ACTIVE→ACTIVE self-loop', () => {
      const transition = getTransition('receive_violation');
      expect(transition.from.value).toBe('ACTIVE');
      expect(transition.to.value).toBe('ACTIVE');
    });

    it('T2.3: receive_violation guard requires event.reporter', () => {
      const transition = getTransition('receive_violation');
      expect(transition.guard).toEqual({ '!!': [{ var: 'event.reporter' }] });
    });

    it('T2.4: receive_violation effect decrements reputation by 10', () => {
      const transition = getTransition('receive_violation');
      const effectStr = JSON.stringify(transition.effect);
      expect(effectStr).toContain('-10');
      expect(effectStr).toContain('reputation');
    });

    it('T2.5: receive_violation effect increments violations counter', () => {
      const transition = getTransition('receive_violation');
      const effectStr = JSON.stringify(transition.effect);
      expect(effectStr).toContain('violations');
    });
  });
});
```

### 9.2 AGENT_TRANSITIONS Tests (SDK)

**File:** `src/apps/identity/__tests__/constants.test.ts`

```typescript
describe('AGENT_TRANSITIONS', () => {
  describe('ACTIVE state transitions', () => {
    it('T3.1: ACTIVE allows receive_vouch', () => {
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'receive_vouch')).toBe(true);
    });

    it('T3.2: ACTIVE allows receive_completion', () => {
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'receive_completion')).toBe(true);
    });

    it('T3.3: ACTIVE allows receive_violation', () => {
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'receive_violation')).toBe(true);
    });

    it('T3.4: ACTIVE allows challenge', () => {
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'challenge')).toBe(true);
    });

    it('T3.5: ACTIVE allows withdraw', () => {
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'withdraw')).toBe(true);
    });

    it('T3.6: ACTIVE rejects invalid event', () => {
      expect(canTransition(AgentState.AGENT_STATE_ACTIVE, 'submit_attestation')).toBe(false);
    });
  });
});
```

### 9.3 Traffic-Gen Event Name Tests (Services)

**File:** `packages/traffic-generator/__tests__/identity-events.test.ts`

```typescript
describe('Identity Event Names', () => {
  describe('getAvailableAgentEvents alignment', () => {
    it('T4.1: ACTIVE state returns receive_vouch not submit_attestation', () => {
      const events = getAvailableAgentEvents({ state: 'ACTIVE' });
      expect(events).toContain('receive_vouch');
      expect(events).not.toContain('submit_attestation');
    });

    it('T4.2: ACTIVE state returns receive_violation not submit_violation', () => {
      const events = getAvailableAgentEvents({ state: 'ACTIVE' });
      expect(events).toContain('receive_violation');
      expect(events).not.toContain('submit_violation');
    });

    it('T4.3: ACTIVE state returns challenge not file_challenge', () => {
      const events = getAvailableAgentEvents({ state: 'ACTIVE' });
      expect(events).toContain('challenge');
      expect(events).not.toContain('file_challenge');
    });

    it('T4.4: ACTIVE state includes receive_completion', () => {
      const events = getAvailableAgentEvents({ state: 'ACTIVE' });
      expect(events).toContain('receive_completion');
    });
  });

  describe('selection.ts weight alignment', () => {
    it('T5.1: receive_vouch has weight defined', () => {
      const weights = getTransitionWeights();
      expect(weights.receive_vouch).toBeDefined();
      expect(weights.submit_attestation).toBeUndefined();
    });

    it('T5.2: receive_violation has weight defined', () => {
      const weights = getTransitionWeights();
      expect(weights.receive_violation).toBeDefined();
      expect(weights.submit_violation).toBeUndefined();
    });

    it('T5.3: challenge has weight defined', () => {
      const weights = getTransitionWeights();
      expect(weights.challenge).toBeDefined();
      expect(weights.file_challenge).toBeUndefined();
    });
  });

  describe('workflows.ts alignment', () => {
    it('T6.1: ACTIVE→CHALLENGED uses challenge event', () => {
      const workflow = getWorkflowTransition('ACTIVE', 'CHALLENGED');
      expect(workflow.event).toBe('challenge');
    });
  });
});
```

### 9.4 Effect Execution Tests (Integration)

**File:** `src/apps/identity/__tests__/effect-execution.test.ts`

```typescript
describe('Effect Execution', () => {
  describe('activate effect', () => {
    it('T7.1: activate sets activatedAt to sequenceNumber value', () => {
      const context = { state: { status: 'REGISTERED' }, sequenceNumber: 42 };
      const result = applyEffect(getTransition('activate').effect, context);
      expect(result.activatedAt).toBe(42);
    });
  });

  describe('receive_violation effect', () => {
    it('T7.2: receive_violation decrements reputation', () => {
      const context = { state: { reputation: 50, violations: 0 }, sequenceNumber: 100 };
      const result = applyEffect(getTransition('receive_violation').effect, context);
      expect(result.reputation).toBe(40);
    });

    it('T7.3: receive_violation increments violations counter', () => {
      const context = { state: { reputation: 50, violations: 2 }, sequenceNumber: 100 };
      const result = applyEffect(getTransition('receive_violation').effect, context);
      expect(result.violations).toBe(3);
    });

    it('T7.4: receive_violation initializes violations counter from 0', () => {
      const context = { state: { reputation: 50 }, sequenceNumber: 100 };
      const result = applyEffect(getTransition('receive_violation').effect, context);
      expect(result.violations).toBe(1);
    });

    it('T7.5: receive_violation sets lastViolationAt', () => {
      const context = { state: { reputation: 50, violations: 0 }, sequenceNumber: 123 };
      const result = applyEffect(getTransition('receive_violation').effect, context);
      expect(result.lastViolationAt).toBe(123);
    });
  });
});
```

### 9.5 Phase 2 Stub Tests (Deferred)

**File:** `src/apps/identity/__tests__/challenge-auth.test.ts`

```typescript
describe('Challenge Auth Guard (Phase 2 - SKIPPED)', () => {
  // These tests document the desired behavior but are skipped until A3 merges
  
  it.skip('T8.1: challenge guard rejects owner self-challenge', () => {
    // After A3: guard should include signer ≠ owner check
  });

  it.skip('T8.2: challenge guard accepts third-party challenger', () => {
    // After A3: guard should pass for non-owner signer
  });

  it.skip('T8.3: challenge transition is in thirdPartyTransitions list', () => {
    // After A3: CreateStateMachine should include challenge in third-party allowed
  });
});
```

### 9.6 Test Summary

| Group | Count | Description |
|-------|-------|-------------|
| T1.x | 3 | $timestamp → sequenceNumber fixes |
| T2.x | 5 | receive_violation transition structure |
| T3.x | 6 | AGENT_TRANSITIONS completeness |
| T4.x | 4 | Traffic-gen event name alignment |
| T5.x | 3 | Selection weights alignment |
| T6.x | 1 | Workflow definition alignment |
| T7.x | 5 | Effect execution correctness |
| T8.x | 3 | Challenge auth guard (Phase 2 stubs) |
| **Total** | **30** | |

---

## 10. Implementation Checklist

### Phase 1 (Unblocked — Can Start Now)

- [ ] **SDK: agent-identity.json**
  - [ ] Replace `$timestamp` with `sequenceNumber` in activate effect
  - [ ] Replace `$timestamp` with `sequenceNumber` in uphold_challenge effect
  - [ ] Replace `$timestamp` with `sequenceNumber` in begin_probation effect
  - [ ] Add receive_violation transition

- [ ] **SDK: constants.ts**
  - [ ] Add `receive_vouch` to ACTIVE transitions
  - [ ] Add `receive_completion` to ACTIVE transitions
  - [ ] Add `receive_violation` to ACTIVE transitions

- [ ] **Services: simulator.ts**
  - [ ] Rename `submit_attestation` → `receive_vouch`/`receive_completion`
  - [ ] Rename `submit_violation` → `receive_violation`
  - [ ] Rename `file_challenge` → `challenge`

- [ ] **Services: selection.ts**
  - [ ] Rename event keys in probability weights

- [ ] **Services: workflows.ts**
  - [ ] Rename `file_challenge` → `challenge`

- [ ] **Tests**
  - [ ] Write failing tests per §9
  - [ ] Verify all tests pass after implementation

### Phase 2 (Blocked on A3)

- [ ] Update challenge guard with signer ≠ owner check
- [ ] Add challenge to thirdPartyTransitions in CreateStateMachine
- [ ] Unskip Phase 2 tests

---

## Appendix A: JLVM Context Variables Reference

From `ContextProvider.scala` (metagraph source):

| Variable | Type | Description |
|----------|------|-------------|
| `state` | Object | Current stateData |
| `event` | Object | Transition event payload |
| `eventName` | String | Name of the transition event |
| `machineId` | String | Fiber UUID |
| `currentStateId` | String | Current state name |
| `sequenceNumber` | Long | Monotonic ordinal counter |
| `proofs` | Array | Signer proofs (address, signature) |
| `machines` | Object | Access to other machines (`machines.self`, `machines.{id}`) |
| `parent` | Object | Parent fiber data (if exists) |
| `children` | Object | Child fibers data |
| `scripts` | Object | Script execution context |

**NOT AVAILABLE:** `$timestamp`, `$epochProgress`, `$ordinal`, `$time`
