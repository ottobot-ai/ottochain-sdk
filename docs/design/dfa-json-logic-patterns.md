# DFA + JSON Logic State Machine Patterns and Templates

**Status:** Design Reference  
**Author:** @think  
**Date:** 2026-02-19  
**Epic:** [Asset Model App - OttoChain SDK Integration](https://trello.com/c/6988fb33)  
**Trello Card:** [📐 Spec: DFA + JSON Logic state machine patterns and templates](https://trello.com/c/699630188cd55eb7feafdc57)  
**Related Docs:** [Producer-Validator Framework](./producer-validator-framework.md) | [Token Behavior Matrix](./token-behavior-matrix.md)

---

## Table of Contents

1. [DFA Formal Model](#1-dfa-formal-model)
2. [Mapping to OttoChain StateMachineDefinition](#2-mapping-to-ottochain-statemachinedefinition)
3. [JSON Logic Guard Integration](#3-json-logic-guard-integration)
4. [Effect System](#4-effect-system)
5. [Standard Lifecycle Templates](#5-standard-lifecycle-templates)
6. [Asset Model Patterns](#6-asset-model-patterns)
7. [Complete Example: Digital Sports Collectible](#7-complete-example-digital-sports-collectible)
8. [Anti-Patterns](#8-anti-patterns)
9. [Composition Patterns](#9-composition-patterns)
10. [Design Checklist](#10-design-checklist)

---

## 1. DFA Formal Model

A **Deterministic Finite Automaton** (DFA) is defined by the quintuple:

```
M = (Q, Σ, δ, q₀, F)
```

| Symbol | Name | Meaning in OttoChain |
|--------|------|---------------------|
| **Q** | States | The set of all lifecycle states (e.g., `{minted, listed, sold}`) |
| **Σ** | Alphabet | The set of all event names (e.g., `{list, purchase, transfer}`) |
| **δ** | Transition function | `δ: Q × Σ → Q` — maps (currentState, event) to nextState |
| **q₀** | Initial state | The state a fiber starts in (e.g., `minted`) |
| **F** | Accepting states | Terminal states where no further transitions are allowed (e.g., `{burned}`) |

**Determinism guarantee:** For any (state, event) pair, there is at most one valid transition. If two transitions share (from, eventName), their guards must be mutually exclusive — the JLVM evaluates them in order and uses the first match.

**JSON Logic extension:** OttoChain extends the classic DFA by attaching a **guard condition** to each transition. A transition fires only if:
1. The fiber is in the `from` state, AND  
2. The `eventName` matches, AND  
3. The `guard` (JSON Logic expression) evaluates to `true`

This transforms the pure DFA into a **guarded transition system** — expressive enough for real-world business rules while remaining deterministic when guards are mutually exclusive.

---

## 2. Mapping to OttoChain StateMachineDefinition

The `StateMachineDefinition` proto type (`ottochain.v1.StateMachineDefinition`) stores the DFA as structured JSON:

### 2.1 Schema Reference

```typescript
// From proto/ottochain/v1/fiber.proto (via generated types)
interface StateMachineDefinition {
  states: Record<string, StateDefinition>;
  initialState: { value: string };
  transitions: TransitionDefinition[];
  metadata?: { name: string; description: string; [key: string]: unknown };
}

interface StateDefinition {
  id: { value: string };      // Must match the key in `states`
  isFinal: boolean;           // If true: no outgoing transitions allowed
  metadata: Record<string, unknown> | null;
}

interface TransitionDefinition {
  from: { value: string };    // Source state ID
  to: { value: string };      // Target state ID
  eventName: string;          // Event that triggers this transition
  guard: JsonLogicExpression; // Must evaluate to true for transition to fire
  effect: JsonLogicExpression; // New state (merged/computed from current state + event)
  dependencies: string[];     // Script fiber IDs this transition reads from
}
```

### 2.2 Minimal Working Example

```json
{
  "states": {
    "pending": { "id": { "value": "pending" }, "isFinal": false, "metadata": null },
    "approved": { "id": { "value": "approved" }, "isFinal": true, "metadata": null },
    "rejected": { "id": { "value": "rejected" }, "isFinal": true, "metadata": null }
  },
  "initialState": { "value": "pending" },
  "transitions": [
    {
      "from": { "value": "pending" },
      "to": { "value": "approved" },
      "eventName": "approve",
      "guard": { "==": [1, 1] },
      "effect": { "merge": [{ "var": "state" }, { "approvedBy": { "var": "event.approver" } }] },
      "dependencies": []
    },
    {
      "from": { "value": "pending" },
      "to": { "value": "rejected" },
      "eventName": "reject",
      "guard": { "==": [1, 1] },
      "effect": { "merge": [{ "var": "state" }, { "rejectedBy": { "var": "event.approver" }, "reason": { "var": "event.reason" } }] },
      "dependencies": []
    }
  ],
  "metadata": { "name": "ApprovalWorkflow", "description": "Simple approval lifecycle" }
}
```

**`{ "==": [1, 1] }` means "always true"** — use this for unconditional transitions.

---

## 3. JSON Logic Guard Integration

### 3.1 Evaluation Context

When a `TransitionStateMachine` DataUpdate arrives at ML0, the JLVM evaluates each candidate transition's `guard` against a **context object** assembled from:

```typescript
interface JLVMGuardContext {
  // The event payload (from TransitionStateMachine.payload)
  event: Record<string, unknown>;

  // Current fiber state (from fiber's calculatedState)
  state: Record<string, unknown>;

  // Signer addresses from the DataUpdate proofs
  // Index 0 is the primary signer
  proofs: Array<{ address: string }>;

  // Script oracle states (keyed by fiber ID)
  // Only populated for fiber IDs listed in transition.dependencies
  scripts: Record<string, {
    state: Record<string, unknown>;
  }>;
}
```

> **Important:** `event.initiator` does NOT exist. Use `proofs[0].address` for the submitter's DAG address (applies to both standard DataUpdates and DataProof-bearing asset model updates).

### 3.2 Common Guard Patterns

#### Always-true (unconditional transition)
```json
{ "==": [1, 1] }
```

#### Require a field to be present
```json
{ "!!": [{ "var": "event.amount" }] }
```

#### Require multiple fields
```json
{
  "and": [
    { "!!": [{ "var": "event.buyerAddress" }] },
    { "!!": [{ "var": "event.amount" }] },
    { "!!": [{ "var": "event.currency" }] }
  ]
}
```

#### Numeric range check
```json
{
  "and": [
    { ">=": [{ "var": "event.amount" }, 1] },
    { "<=": [{ "var": "event.amount" }, 10000] }
  ]
}
```

#### Caller identity check (require specific signer)
```json
{
  "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }]
}
```

#### State field comparison
```json
{ "===": [{ "var": "state.status" }, "verified"] }
```

#### Ordinal-based expiry check
```json
{ ">=": [{ "var": "event.$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
```

> Use `$ordinal` (current snapshot ordinal), NOT `$timestamp`. Timestamps are non-deterministic across validators.

#### Enum membership check
```json
{ "in": [{ "var": "event.currency" }, ["DAG", "USDC", "ETH"]] }
```

#### Delegation check (requires JLVM Delegation Operators — PR #90)
```json
{
  "and": [
    { "is_delegated_by": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }] },
    { "delegation_scope_includes": [{ "var": "proofs.0.address" }, "transfer"] },
    { "delegation_not_expired": [{ "var": "proofs.0.address" }] }
  ]
}
```

#### Oracle state check (requires `dependencies: [oracleFiberId]`)
```json
{
  "===": [{ "var": "scripts.oracle-fiber-id-here.state.kycStatus" }, "APPROVED"]
}
```

### 3.3 Guard Composition Rules

**Rule 1: Mutual exclusivity for same (from, eventName)**

When two transitions share the same `from` state and `eventName`, their guards MUST be mutually exclusive to preserve DFA determinism. The JLVM takes the first match, so ordering matters.

```json
// ✅ CORRECT — mutually exclusive
[
  { "from": {"value":"playing"}, "to": {"value":"finished"}, "eventName": "make_move",
    "guard": { "===": [{"var": "scripts.oracle.state.status"}, "Won"] } },
  { "from": {"value":"playing"}, "to": {"value":"playing"}, "eventName": "make_move",
    "guard": { "===": [{"var": "scripts.oracle.state.status"}, "InProgress"] } }
]

// ❌ WRONG — both could be true at the same time
[
  { "guard": { ">=": [{"var": "event.score"}, 100] } },
  { "guard": { ">=": [{"var": "event.score"}, 50] } }   // overlaps!
]
```

**Rule 2: Keep guards side-effect-free**

Guards are evaluated speculatively during validation. Never structure a guard that has side effects (like an oracle call). All side effects belong in `effect`.

**Rule 3: Default/fallback transitions**

To handle unexpected events gracefully (without leaving the fiber stuck), add a catch-all transition to an `error` state:

```json
{
  "from": { "value": "listed" },
  "to": { "value": "error" },
  "eventName": "purchase",
  "guard": { "!": [{ "!!": [{ "var": "event.buyerAddress" }] }] },
  "effect": { "merge": [{ "var": "state" }, { "errorReason": "missing_buyer_address" }] },
  "dependencies": []
}
```

---

## 4. Effect System

### 4.1 Effect Evaluation

The `effect` field is a JSON Logic expression evaluated after a transition fires. Its return value becomes the fiber's new state data.

> **Critical:** The `effect` is evaluated AFTER the guard passes. Effects are executed exactly once per successful transition. The resulting value replaces the entire state (not merged automatically unless you use `merge`).

### 4.2 Common Effect Patterns

#### Preserve existing state + add new fields
```json
{ "merge": [{ "var": "state" }, { "newField": { "var": "event.newValue" } }] }
```

#### Replace state entirely (dangerous — only for initialization)
```json
{
  "owner": { "var": "event.initialOwner" },
  "amount": { "var": "event.initialAmount" },
  "createdAtOrdinal": { "var": "event.$ordinal" }
}
```

#### Increment a counter
```json
{ "merge": [{ "var": "state" }, { "count": { "+": [{ "var": "state.count" }, 1] }] }] }
```

#### Update ownership
```json
{
  "merge": [
    { "var": "state" },
    {
      "previousOwner": { "var": "state.currentOwner" },
      "currentOwner": { "var": "event.newOwner" },
      "transferredAtOrdinal": { "var": "event.$ordinal" }
    }
  ]
}
```

#### Conditional state update
```json
{
  "merge": [
    { "var": "state" },
    {
      "amount": {
        "if": [
          { "var": "event.amount" },
          { "var": "event.amount" },
          { "var": "state.amount" }
        ]
      }
    }
  ]
}
```

### 4.3 Special Effect Keys

| Key | Meaning |
|-----|---------|
| `_oracleCall` | Invoke a script fiber method (oracle pattern) |
| `_emit` | Emit events to other fibers |

#### `_oracleCall` — invoke script oracle

```json
{
  "_oracleCall": {
    "fiberId": { "var": "state.oracleFiberId" },
    "method": "methodName",
    "args": {
      "argA": { "var": "event.fieldA" },
      "argB": { "var": "state.fieldB" }
    }
  },
  "localStateField": { "var": "event.someValue" }
}
```

The script oracle executes its method; its updated state is then available via `scripts.{fiberId}.state.*`.

#### `_emit` — emit events

```json
{
  "merge": [{ "var": "state" }, { "completedAt": { "var": "event.$ordinal" } }],
  "_emit": [
    {
      "name": "asset_transferred",
      "data": {
        "assetId": { "var": "state.assetId" },
        "from": { "var": "state.currentOwner" },
        "to": { "var": "event.newOwner" }
      }
    }
  ]
}
```

---

## 5. Standard Lifecycle Templates

These templates cover the most common asset lifecycle patterns. Use them as starting points.

### 5.1 Simple Binary (Draft → Active | Cancelled)

```
draft → active
draft → cancelled
```

```json
{
  "states": {
    "draft":     { "id": {"value":"draft"},     "isFinal": false, "metadata": null },
    "active":    { "id": {"value":"active"},    "isFinal": false, "metadata": null },
    "cancelled": { "id": {"value":"cancelled"}, "isFinal": true,  "metadata": null }
  },
  "initialState": { "value": "draft" },
  "transitions": [
    {
      "from": {"value":"draft"}, "to": {"value":"active"},
      "eventName": "activate",
      "guard": { "!!": [{"var": "event.activatedBy"}] },
      "effect": { "merge": [{"var":"state"}, {"activatedBy": {"var":"event.activatedBy"}, "activatedAt": {"var":"event.$ordinal"}}] },
      "dependencies": []
    },
    {
      "from": {"value":"draft"}, "to": {"value":"cancelled"},
      "eventName": "cancel",
      "guard": { "==": [1, 1] },
      "effect": { "merge": [{"var":"state"}, {"cancelledAt": {"var":"event.$ordinal"}}] },
      "dependencies": []
    },
    {
      "from": {"value":"active"}, "to": {"value":"cancelled"},
      "eventName": "cancel",
      "guard": { "==": [1, 1] },
      "effect": { "merge": [{"var":"state"}, {"cancelledAt": {"var":"event.$ordinal"}}] },
      "dependencies": []
    }
  ]
}
```

### 5.2 Linear Approval Chain (Draft → Submitted → Approved | Rejected)

```
draft → submitted → approved (terminal)
              └──→  rejected (terminal)
```

**Pattern:** Sequential stages with gated terminal outcomes. Each `→` is a separate `eventName`. Used for: document approvals, KYC, governance proposals.

```json
{
  "states": {
    "draft":     { "id": {"value":"draft"},     "isFinal": false, "metadata": null },
    "submitted": { "id": {"value":"submitted"}, "isFinal": false, "metadata": null },
    "approved":  { "id": {"value":"approved"},  "isFinal": true,  "metadata": null },
    "rejected":  { "id": {"value":"rejected"},  "isFinal": true,  "metadata": null }
  },
  "initialState": { "value": "draft" },
  "transitions": [
    {
      "from": {"value":"draft"}, "to": {"value":"submitted"}, "eventName": "submit",
      "guard": { "!!": [{"var": "event.submittedBy"}] },
      "effect": { "merge": [{"var":"state"}, {"submittedBy": {"var":"event.submittedBy"}, "submittedAt": {"var":"event.$ordinal"}}] },
      "dependencies": []
    },
    {
      "from": {"value":"submitted"}, "to": {"value":"approved"}, "eventName": "approve",
      "guard": { "!!": [{"var": "event.approver"}] },
      "effect": { "merge": [{"var":"state"}, {"approvedBy": {"var":"event.approver"}, "approvedAt": {"var":"event.$ordinal"}}] },
      "dependencies": []
    },
    {
      "from": {"value":"submitted"}, "to": {"value":"rejected"}, "eventName": "reject",
      "guard": { "!!": [{"var": "event.approver"}] },
      "effect": { "merge": [{"var":"state"}, {"rejectedBy": {"var":"event.approver"}, "reason": {"var":"event.reason"}, "rejectedAt": {"var":"event.$ordinal"}}] },
      "dependencies": []
    }
  ]
}
```

### 5.3 Linear Pipeline (Pending → Confirmed → Shipped → Delivered)

```
pending → confirmed → shipped → delivered (terminal)
pending → cancelled (terminal)
confirmed → cancelled (terminal)
```

**Pattern:** Sequential milestones with a cancellation escape at each non-terminal stage. Used for: orders, shipments, manufacturing steps.

See: [simple-order example](../../e2e-test/examples/simple-order/definition.json)

### 5.4 Ownership Transfer Chain (Minted → Listed → Sold → Transferred)

```
minted → listed → sold → transferred
    ↑        ↓
    └── delisted ──┘
```

**Pattern:** Ownership changes at `sold`; `transferred` can loop back (resale). Used for: NFTs, collectibles, asset token transfers.

See: [Section 7](#7-complete-example-digital-sports-collectible) for full definition.

### 5.5 Escrow Pattern (Pending → Funded → Released | Refunded)

```
pending → funded → released (terminal)
               └→  refunded (terminal)
```

**Pattern:** Funds locked in `funded`; either the beneficiary gets paid (`released`) or money returns (`refunded`). Guards on release/refund typically check ordinal-based timeouts or external conditions.

See: [token-escrow example](../../e2e-test/examples/token-escrow/definition.json)

### 5.6 Full Asset Lifecycle (Draft → Active → Locked → Expired | Burned)

```
draft → active → locked → burned (terminal)
         ↓ ↑       ↓
        error   expired (terminal)
```

**Pattern:** Active assets can be locked (restricted) and then burned. An `expired` path handles ordinal-based time-outs. Used for: governance-controlled tokens, time-limited memberships, expirable credentials.

```
States: draft, active, locked, expired, burned, error
Events: activate, lock, unlock, expire, burn
Guards on expire: { ">=": [{"var": "event.$ordinal"}, {"var": "state.expiresAtOrdinal"}] }
```

---

## 6. Asset Model Patterns

How DFA + JLVM integrates with the [Producer-Validator Framework](./producer-validator-framework.md) and [Token Behavior Matrix](./token-behavior-matrix.md).

### 6.1 Producer-Validator Role Encoding in DFA

The producer-validator framework says:
- **Producers** submit events (DataUpdates with DataProof)
- **Validators** define governance rules

In a DFA, this maps to:
- Producers trigger transitions by submitting events to the fiber
- Validators define the `guard` conditions that restrict which transitions are allowed
- The validator's `ProducerValidatorAgreement.policy` is an additional JSON Logic check layered ABOVE the transition guard

**Layered evaluation order for asset-model fibers:**
```
1. DataProof validation (agreement exists, not revoked/expired, sig valid)
2. Transition guard evaluation (JLVM, using event + state + proofs context)
3. Agreement policy evaluation (JLVM, using event + state, from agreement.policy)
4. If ALL pass → apply effect, advance state
```

### 6.2 Token Behavior Matrix DFA Implications

From the [16-type token behavior matrix](./token-behavior-matrix.md), each combination of `(transferable, divisible, expirable, governable)` implies guard constraints:

| Behavior | DFA Guard Pattern |
|----------|------------------|
| `!transferable` | Guard on `transfer` events: `{ "===": [{"var": "proofs.0.address"}, {"var": "state.ownerAddress"}] }` — only owner can "transfer" (which in this case is rejected by DFA, so there's no transfer transition at all) |
| `expirable` | Add `expired` terminal state; guard `{ ">=": [{"var": "event.$ordinal"}, {"var": "state.expiresAtOrdinal"}] }` on `expire` event from any non-terminal state |
| `governable` | Add validator-gated transitions; guard on policy-required events checks `proofs.0.address` against known validator addresses |
| `divisible` | State must track `amount`; split transitions produce multiple child fibers |

### 6.3 State-Gated Producer Actions

To allow producers to act only in certain states:

```json
{
  "from": {"value": "active"},
  "to": {"value": "active"},
  "eventName": "data_submission",
  "guard": {
    "and": [
      { "===": [{"var": "proofs.0.address"}, {"var": "state.registeredProducer"}] },
      { "!!": [{"var": "event.payload"}] }
    ]
  },
  "effect": {
    "merge": [{"var": "state"}, {
      "lastSubmission": {"var": "event.payload"},
      "submissionCount": {"+": [{"var": "state.submissionCount"}, 1]},
      "lastSubmittedAt": {"var": "event.$ordinal"}
    }]
  },
  "dependencies": []
}
```

---

## 7. Complete Example: Digital Sports Collectible

A digital sports collectible (NFT-like asset) with a full lifecycle, ordinal-based expiry, ownership transfer, and governance locking.

### 7.1 State Diagram

```
     ┌─────────────────────────────────────────────────────────┐
     │                                                         │
  [minted] ──list──► [listed] ──purchase──► [owned] ──transfer──► [owned]
                        │ ↑                    │
                      delist                  lock
                        │ │                    ▼
                        │ │              [governance_locked]
                        │ │                    │
                     [minted]               unlock
                                              │
                      expire event can occur from [listed] or [owned]
                                              │
                                              ▼
                                          [expired] ← terminal
                                              │
                                          [burned] ← terminal (from any)
```

### 7.2 State Machine Definition

```json
{
  "states": {
    "minted": {
      "id": { "value": "minted" },
      "isFinal": false,
      "metadata": { "description": "Newly created, held by creator, not yet on market" }
    },
    "listed": {
      "id": { "value": "listed" },
      "isFinal": false,
      "metadata": { "description": "On the marketplace, available for purchase" }
    },
    "owned": {
      "id": { "value": "owned" },
      "isFinal": false,
      "metadata": { "description": "Held by an owner, off market" }
    },
    "governance_locked": {
      "id": { "value": "governance_locked" },
      "isFinal": false,
      "metadata": { "description": "Temporarily locked by validator; no transfers" }
    },
    "expired": {
      "id": { "value": "expired" },
      "isFinal": true,
      "metadata": { "description": "Past expiry ordinal; no further actions" }
    },
    "burned": {
      "id": { "value": "burned" },
      "isFinal": true,
      "metadata": { "description": "Permanently destroyed" }
    }
  },
  "initialState": { "value": "minted" },
  "transitions": [
    {
      "from": { "value": "minted" },
      "to": { "value": "listed" },
      "eventName": "list",
      "guard": {
        "and": [
          { "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }] },
          { ">=": [{ "var": "event.askingPrice" }, 1] },
          { "!!": [{ "var": "event.currency" }] }
        ]
      },
      "effect": {
        "merge": [
          { "var": "state" },
          {
            "askingPrice": { "var": "event.askingPrice" },
            "currency": { "var": "event.currency" },
            "listedAt": { "var": "event.$ordinal" }
          }
        ]
      },
      "dependencies": []
    },

    {
      "from": { "value": "listed" },
      "to": { "value": "minted" },
      "eventName": "delist",
      "guard": {
        "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }]
      },
      "effect": {
        "merge": [
          { "var": "state" },
          { "askingPrice": null, "currency": null, "listedAt": null }
        ]
      },
      "dependencies": []
    },

    {
      "from": { "value": "listed" },
      "to": { "value": "owned" },
      "eventName": "purchase",
      "guard": {
        "and": [
          { "!!": [{ "var": "event.buyerAddress" }] },
          { "===": [{ "var": "event.paidAmount" }, { "var": "state.askingPrice" }] },
          { "===": [{ "var": "event.currency" }, { "var": "state.currency" }] },
          {
            "!": [{
              "===": [{ "var": "event.buyerAddress" }, { "var": "state.ownerAddress" }]
            }]
          }
        ]
      },
      "effect": {
        "merge": [
          { "var": "state" },
          {
            "previousOwner": { "var": "state.ownerAddress" },
            "ownerAddress": { "var": "event.buyerAddress" },
            "purchasePrice": { "var": "event.paidAmount" },
            "purchasedAt": { "var": "event.$ordinal" },
            "askingPrice": null,
            "currency": null,
            "listedAt": null,
            "transferCount": { "+": [{ "var": "state.transferCount" }, 1] }
          }
        ]
      },
      "dependencies": []
    },

    {
      "from": { "value": "owned" },
      "to": { "value": "owned" },
      "eventName": "transfer",
      "guard": {
        "and": [
          { "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }] },
          { "!!": [{ "var": "event.recipientAddress" }] },
          {
            "!": [{
              "===": [{ "var": "event.recipientAddress" }, { "var": "state.ownerAddress" }]
            }]
          }
        ]
      },
      "effect": {
        "merge": [
          { "var": "state" },
          {
            "previousOwner": { "var": "state.ownerAddress" },
            "ownerAddress": { "var": "event.recipientAddress" },
            "transferredAt": { "var": "event.$ordinal" },
            "transferCount": { "+": [{ "var": "state.transferCount" }, 1] }
          }
        ]
      },
      "dependencies": []
    },

    {
      "from": { "value": "owned" },
      "to": { "value": "governance_locked" },
      "eventName": "lock",
      "guard": {
        "and": [
          { "===": [{ "var": "proofs.0.address" }, { "var": "state.validatorAddress" }] },
          { "!!": [{ "var": "event.lockReason" }] }
        ]
      },
      "effect": {
        "merge": [
          { "var": "state" },
          {
            "lockReason": { "var": "event.lockReason" },
            "lockedAt": { "var": "event.$ordinal" },
            "lockedBy": { "var": "proofs.0.address" }
          }
        ]
      },
      "dependencies": []
    },

    {
      "from": { "value": "governance_locked" },
      "to": { "value": "owned" },
      "eventName": "unlock",
      "guard": {
        "===": [{ "var": "proofs.0.address" }, { "var": "state.validatorAddress" }]
      },
      "effect": {
        "merge": [
          { "var": "state" },
          { "lockReason": null, "lockedAt": null, "lockedBy": null, "unlockedAt": { "var": "event.$ordinal" } }
        ]
      },
      "dependencies": []
    },

    {
      "from": { "value": "listed" },
      "to": { "value": "expired" },
      "eventName": "expire",
      "guard": {
        "and": [
          { ">": [{ "var": "state.expiresAtOrdinal" }, 0] },
          { ">=": [{ "var": "event.$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
        ]
      },
      "effect": {
        "merge": [{ "var": "state" }, { "expiredAt": { "var": "event.$ordinal" } }]
      },
      "dependencies": []
    },

    {
      "from": { "value": "owned" },
      "to": { "value": "expired" },
      "eventName": "expire",
      "guard": {
        "and": [
          { ">": [{ "var": "state.expiresAtOrdinal" }, 0] },
          { ">=": [{ "var": "event.$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
        ]
      },
      "effect": {
        "merge": [{ "var": "state" }, { "expiredAt": { "var": "event.$ordinal" } }]
      },
      "dependencies": []
    },

    {
      "from": { "value": "owned" },
      "to": { "value": "burned" },
      "eventName": "burn",
      "guard": {
        "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }]
      },
      "effect": {
        "merge": [{ "var": "state" }, { "burnedAt": { "var": "event.$ordinal" } }]
      },
      "dependencies": []
    }
  ],

  "metadata": {
    "name": "DigitalSportsCollectible",
    "description": "Collectible lifecycle: minted → listed → owned, with governance locking and ordinal-based expiry",
    "asset_model": "true",
    "version": "1.0.0"
  }
}
```

### 7.3 Initial Data for CreateStateMachine

```json
{
  "assetId": "collectible-2026-season-001",
  "assetType": "sports_collectible",
  "ownerAddress": "DAGproducerAddress...",
  "validatorAddress": "DAGvalidatorAddress...",
  "agreementId": "abc123...",
  "expiresAtOrdinal": 50000,
  "transferCount": 0,
  "createdAt": 4201
}
```

---

## 8. Anti-Patterns

### 8.1 ❌ State Explosion

**Problem:** Creating a distinct state for every combination of attributes instead of storing them as state data.

```
// ❌ WRONG — 8 states for 3 boolean attributes
listed_public_active, listed_public_paused, listed_private_active,
listed_private_paused, owned_locked_active, owned_locked_paused, ...

// ✅ CORRECT — 3 states + attributes as state data
listed, owned, locked
// State data: { "isPublic": true, "isPaused": false }
// Guards check: { "===": [{"var": "state.isPaused"}, false] }
```

**Rule:** States represent lifecycle stages. Attributes belong in state data.

### 8.2 ❌ Missing Error States

**Problem:** No error exit from a state means the fiber can get permanently stuck.

```json
// ❌ WRONG — if fund fails for any reason, fiber is forever in "pending"
{ "from": "pending", "to": "funded", "eventName": "fund", "guard": {...} }

// ✅ CORRECT — add a failed terminal state
{ "from": "pending", "to": "funded",  "eventName": "fund", "guard": { "and": [{...}, {...}] } },
{ "from": "pending", "to": "failed",  "eventName": "fund", "guard": { "!": [{"and": [{...},{...}]}] } }
```

**Rule:** For every non-terminal state, ensure all events have a reachable outcome (success or error).

### 8.3 ❌ Circular Transitions Without Termination

**Problem:** A loop with no terminal state or expiry means the fiber runs forever.

```
// ❌ WRONG — locked can only go back to active, active can only go to locked
active → locked → active → locked → ...

// ✅ CORRECT — add escape routes
active → locked → active  (loop is fine)
active → burned           (terminal)
locked → expired          (ordinal-based timeout)
```

**Rule:** Every connected component of the DFA must have a path to at least one terminal (`isFinal: true`) state.

### 8.4 ❌ Overlapping Guards on Same (from, eventName)

**Problem:** Two transitions with the same `from` and `eventName` have guards that are not mutually exclusive. The first match wins, which may be non-deterministic depending on input values.

```json
// ❌ WRONG — overlap when score is between 50 and 100
[
  { "guard": { ">=": [{"var": "event.score"}, 100] }, "to": "gold" },
  { "guard": { ">=": [{"var": "event.score"}, 50] }, "to": "silver" }
]

// ✅ CORRECT — explicit ranges
[
  { "guard": { ">=": [{"var": "event.score"}, 100] }, "to": "gold" },
  { "guard": { "and": [{">=": [{"var":"event.score"}, 50]}, {"<":[{"var":"event.score"},100]}] }, "to": "silver" }
]
```

**Rule:** For any given (from, eventName) pair, guards must partition the input space.

### 8.5 ❌ Using `$timestamp` Instead of `$ordinal`

**Problem:** `$timestamp` is not reliably consistent across validators in distributed consensus. Guards based on wall-clock time can evaluate differently across nodes, breaking DFA determinism.

```json
// ❌ WRONG
{ ">=": [{"var": "event.$timestamp"}, {"var": "state.expiresAt"}] }

// ✅ CORRECT
{ ">=": [{"var": "event.$ordinal"}, {"var": "state.expiresAtOrdinal"}] }
```

**Rule:** Always use `$ordinal` for time-based comparisons.

### 8.6 ❌ Side Effects in Guards

**Problem:** Putting oracle calls or state mutations in the `guard` expression causes them to run during speculative validation, before the transition is committed.

```json
// ❌ WRONG — oracle call in guard
{
  "guard": { "_oracleCall": { "fiberId": "...", "method": "check", "args": {} } }
}

// ✅ CORRECT — check oracle state (already available via dependencies), call in effect
{
  "guard": { "===": [{"var": "scripts.oracle.state.status"}, "APPROVED"] },
  "effect": { "_oracleCall": { "fiberId": "...", "method": "execute", "args": {} } },
  "dependencies": ["oracle-fiber-id"]
}
```

**Rule:** Guards are read-only. All writes and oracle mutations go in `effect`.

### 8.7 ❌ Forgetting `isFinal: true` on Terminal States

**Problem:** A state intended to be terminal but missing `isFinal: true` will still accept events, potentially corrupting lifecycle semantics.

```json
// ❌ WRONG — burned is final but not flagged
{ "burned": { "id": {"value":"burned"}, "isFinal": false, "metadata": null } }

// ✅ CORRECT
{ "burned": { "id": {"value":"burned"}, "isFinal": true, "metadata": null } }
```

**Rule:** Set `isFinal: true` on every terminal state. The metagraph enforces no transitions out of final states.

---

## 9. Composition Patterns

### 9.1 Parent-Child Fiber Hierarchy

Use `parentFiberId` in `CreateStateMachine` to create hierarchical DFAs:

```
Parent: PortfolioFiber (states: active, liquidated)
  ├── Child: AssetFiber_1 (states: minted, listed, owned)
  ├── Child: AssetFiber_2 (states: minted, owned, burned)
  └── Child: AssetFiber_3 (states: minted, listed, expired)
```

The parent fiber can listen to `_emit` events from children to aggregate state.

### 9.2 Oracle Pattern (Script as External State)

Use a `CreateScript` fiber as a stateful oracle that the DFA queries:

```
StateMachineDefinition fiber → reads scripts.{oracleFiberId}.state.*
                             → calls oracle via _oracleCall effect
```

See: [TicTacToe example](../../e2e-test/examples/tictactoe/sm-definition.ts) for full oracle integration.

### 9.3 Parallel Tracking via `_emit`

When a transition fires, emit events to sibling fibers for parallel state tracking:

```json
"_emit": [
  { "name": "ownership_changed", "data": { "assetId": {"var":"state.assetId"}, "newOwner": {"var":"event.newOwner"} }, "destination": "portfolio-tracker-fiber-id" }
]
```

---

## 10. Design Checklist

Before finalizing a state machine definition, verify:

**Completeness:**
- [ ] Every non-terminal state has at least one transition out
- [ ] Every non-terminal state has a path to a terminal state
- [ ] All expected event names are covered by at least one transition

**Determinism:**
- [ ] For every (state, eventName) pair, guards are mutually exclusive
- [ ] No overlapping numeric ranges in guards
- [ ] No `$timestamp` used — only `$ordinal`

**Security:**
- [ ] Every sensitive transition checks `proofs.0.address` against expected caller
- [ ] Caller identity is always validated (even for "public" transitions — at minimum log it)
- [ ] Oracle dependencies are declared in `dependencies` array

**Effects:**
- [ ] All effects use `merge` to preserve existing state (unless full replace is intentional)
- [ ] All oracle calls are in `effect`, not `guard`
- [ ] `_emit` destinations are correct fiber IDs

**Terminal States:**
- [ ] All terminal states have `isFinal: true`
- [ ] No transitions point out of final states
- [ ] At least one terminal state is reachable from every state

**Asset Model:**
- [ ] `metadata["asset_model"] = "true"` set if this fiber uses the Producer-Validator framework
- [ ] `expiresAtOrdinal` is set in `initialData` for expirable token types (or `0` for no expiry)
- [ ] `validatorAddress` stored in state for governable tokens

---

## References

- [OttoChain TicTacToe Example](../../e2e-test/examples/tictactoe/sm-definition.ts) — Complex oracle-based DFA
- [OttoChain Token Escrow Example](../../e2e-test/examples/token-escrow/definition.json) — Simple escrow DFA
- [OttoChain Approval Workflow Example](../../e2e-test/examples/approval-workflow/definition.json) — Linear approval chain
- [OttoChain Simple Order Example](../../e2e-test/examples/simple-order/definition.json) — Pipeline with cancellation
- [Token Behavior Matrix](./token-behavior-matrix.md) — 16-type system and JLVM guards
- [Producer-Validator Framework](./producer-validator-framework.md) — Asset model architecture
- [Tokenized Event-Stream Protocol Analysis (@research, 2026-02-08)](../../memory/archive/2026-02-08-tokenized-streams-analysis.md)

---

*Design reference by @think. Companion spec for the DFA state machine engine implementation card (`69963015455aaf15dc445097`).*
