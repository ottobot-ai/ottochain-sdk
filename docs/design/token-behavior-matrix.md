# OttoChain 16-Type Token Behavior Matrix

> **Status:** Reference specification  
> **Epic:** Asset Model Exploration  
> **Audience:** OttoChain developers building asset model applications  
> **Related:** `producer-validator-framework.md`, `dfa-json-logic-patterns.md`

---

## Overview

Every token in the OttoChain asset model is characterized by four independent boolean properties. Together, these produce 2⁴ = **16 distinct token types**, each with a precisely defined set of legal operations and enforcement semantics.

This matrix is the canonical reference for:
- Choosing the right token type for your application
- Understanding which operations are legal for a given type
- Knowing how the runtime enforces token behavior
- Designing state machines and JSON Logic guards for token fibers

---

## The Four Dimensions

### T — Transferable

**Does the token's ownership change on transfer?**

| Value | Meaning |
|-------|---------|
| `true` | Token can move between holders. `transfer` operation is legal. |
| `false` | Token is **soulbound** — permanently bound to the original minting address. `transfer` is always rejected. |

**Real-world analogy:** A concert ticket (transferable) vs. a driver's license (soulbound).

---

### D — Divisible

**Can the token exist in fractional amounts?**

| Value | Meaning |
|-------|---------|
| `true` | Token supports decimal precision. `split` and `merge` are legal. |
| `false` | Token must exist as whole units only. `split` is rejected; amounts must always be integers ≥ 1. |

**Real-world analogy:** A dollar (divisible, can be 0.50) vs. a baseball card (indivisible — you either have it or you don't).

---

### E — Expirable

**Does the token have a time-bounded validity window?**

| Value | Meaning |
|-------|---------|
| `true` | Token carries an `expiresAtOrdinal` field — a snapshot ordinal deadline. Once the current ordinal exceeds this value, all operations except `burn` are rejected. |
| `false` | Token is permanent — no validity deadline. Once minted, it exists until explicitly burned. |

**Real-world analogy:** A parking permit valid for one year (expirable) vs. a property deed (permanent).

> **⚠️ Critical: Ordinal-based expiry, not Unix timestamps.**  
> The JLVM does not expose a `$timestamp` variable. The available context variables are:
> - `$ordinal` — current snapshot ordinal (integer counter)
> - `$epochProgress` — current epoch progress
> - `$lastSnapshotHash` — parent snapshot hash (for pseudo-randomness)
>
> Token expiry must be stored as `expiresAtOrdinal` (an ordinal integer), not as a Unix millisecond timestamp. Example guard:
> ```json
> { "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
> ```
>
> **Ordinal-to-time approximation:** The OttoChain network produces approximately 1 snapshot per 5–10 seconds. A rough conversion: `expiresAtOrdinal ≈ currentOrdinal + (durationSeconds / avgSecondsPerSnapshot)`. This is an estimate — ordinal rates vary under load. For strict deadline enforcement, err on the side of a shorter ordinal window.

---

### G — Governable

**Is the token subject to validator policy enforcement?**

| Value | Meaning |
|-------|---------|
| `true` | Every operation is evaluated against the token's JSON Logic policy rules before being accepted. The validator (not just the producer) controls what is allowed. |
| `false` | Operations are accepted if structurally valid — no additional policy checks. The producer has full autonomy. |

**Real-world analogy:** A security (governable — must pass KYC/AML checks on transfer) vs. a gift card (non-governable — use freely).

> **Key distinction:** Governable ≠ permissioned by a centralized authority. The *policy* is onchain JSON Logic defined at mint time. Any validator can evaluate it trustlessly.

---

## The 16 Token Types

Types are numbered 0–15 using binary encoding `TDEG` (T=bit3, D=bit2, E=bit1, G=bit0).

```
Type = T×8 + D×4 + E×2 + G×1
```

| Type | T | D | E | G | Archetype | Primary Use Case |
|------|---|---|---|---|-----------|-----------------|
| **0** | ✗ | ✗ | ✗ | ✗ | **Soulbound Collectible** | Permanent achievements, honors, diplomas |
| **1** | ✗ | ✗ | ✗ | ✓ | **Governed Badge** | Role-based access, membership with policy enforcement |
| **2** | ✗ | ✗ | ✓ | ✗ | **Expiring Credential** | Time-limited certification, seasonal status |
| **3** | ✗ | ✗ | ✓ | ✓ | **Governed Credential** | Licenses, permits (soulbound + expiry + policy) |
| **4** | ✗ | ✓ | ✗ | ✗ | **Reputation Score** | Continuous reputation points, accumulated metrics |
| **5** | ✗ | ✓ | ✗ | ✓ | **Governed Score** | Regulated reputation with validator-controlled accrual |
| **6** | ✗ | ✓ | ✓ | ✗ | **Expiring Credits** | Seasonal airdrop, time-limited loyalty points (non-transferable) |
| **7** | ✗ | ✓ | ✓ | ✓ | **Governed Expiring Credits** | Regulated time-limited allocation (e.g., carbon credits per period) |
| **8** | ✓ | ✗ | ✗ | ✗ | **Pure Collectible (NFT)** | Digital art, sports collectibles, unique assets |
| **9** | ✓ | ✗ | ✗ | ✓ | **Governed Collectible** | Regulated securities, equity tokens, restricted NFTs |
| **10** | ✓ | ✗ | ✓ | ✗ | **Ticket** | Event tickets, passes, time-bounded access tokens |
| **11** | ✓ | ✗ | ✓ | ✓ | **Governed Ticket** | Regulated short-term access (e.g., airline boarding pass) |
| **12** | ✓ | ✓ | ✗ | ✗ | **Fungible Token** | Utility tokens, simple currencies, ERC-20 equivalent |
| **13** | ✓ | ✓ | ✗ | ✓ | **Regulated Token** | Stablecoins, security tokens, compliant DeFi assets |
| **14** | ✓ | ✓ | ✓ | ✗ | **Loyalty Points** | Reward programs, subscription credits with expiry |
| **15** | ✓ | ✓ | ✓ | ✓ | **Full-Featured Asset** | Complex financial instruments, governed utility tokens with expiry |

---

## Operation Legality Matrix

For each of the 8 core operations, this table shows when it is **allowed (✓)** or **rejected (✗)** based on the four dimensions.

> `any` = permitted regardless of this dimension's value.

| Operation | T=0 | T=1 | D=0 | D=1 | E=0 | E=1 (active) | E=1 (expired) | G=0 | G=1 |
|-----------|-----|-----|-----|-----|-----|-------------|--------------|-----|-----|
| `mint` | any ✓ | any ✓ | any ✓ | any ✓ | any ✓ | any ✓ | ✗ | any ✓ | policy |
| `burn` | any ✓ | any ✓ | any ✓ | any ✓ | any ✓ | any ✓ | ✓ | any ✓ | policy |
| `transfer` | ✗ | ✓ | any | any | any ✓ | ✓ | ✗ | any ✓ | policy |
| `split` | any ✗ | any ✗ | ✗ | ✓ | any ✓ | ✓ | ✗ | any ✓ | policy |
| `merge` | any ✓ | any ✓ | ✗ | ✓ | any ✓ | ✓ | ✗ | any ✓ | policy |
| `set_policy` | any | any | any | any | any | any | any | ✗ | ✓ |
| `extend_expiry` | any | any | any | any | ✗ | ✓ | ✓* | any ✓ | policy |
| `check_valid` | any ✓ | any ✓ | any ✓ | any ✓ | always valid | `$ordinal < state.expiresAtOrdinal` | invalid | any ✓ | policy |

> *`extend_expiry` on an expired token: permitted only if `G=1` and policy allows revival (i.e., sets a new `expiresAtOrdinal` greater than current `$ordinal`).

### Operation Definitions

| Operation | Description |
|-----------|-------------|
| `mint` | Create new token units and assign to an initial holder |
| `burn` | Destroy token units (reduce supply permanently) |
| `transfer` | Change the holder address of a whole-unit token (T=1 only) |
| `split` | Divide a token amount into two smaller amounts (D=1 only) |
| `merge` | Combine two token amounts from the same holder (D=1 only) |
| `set_policy` | Update the JSON Logic governance policy attached to the token (G=1 only) |
| `extend_expiry` | Move the `expiresAtOrdinal` deadline forward (E=1 only) |
| `check_valid` | Query whether the token is still within its validity window |

---

## Type-by-Type Reference

### Type 0 — Soulbound Collectible `[-, -, -, -]`

**Behavior:** Mint to owner. Permanently bound. No division. No expiry. No policy checks.

**Legal operations:** `mint`, `burn`, `merge` (aggregate count only)  
**Illegal:** `transfer`, `split`, `set_policy`, `extend_expiry`

**State invariants:**
- `holder` never changes after mint
- `amount` is always a non-negative integer
- No `expiresAtOrdinal` field present

**Example use case:** Graduation diploma, "Hall of Fame" trophy, on-chain achievement badge.

```typescript
const diplomaToken = {
  type: 0,  // T=0, D=0, E=0, G=0
  holder: "DAG4xyzAwardRecipient",
  amount: 1,
  metadata: { title: "B.S. Computer Science", year: 2024 }
};
// transfer attempt → REJECTED: token is soulbound
// burn → allowed (holder can destroy their own)
```

---

### Type 1 — Governed Badge `[-, -, -, G]`

**Behavior:** Soulbound + policy enforcement on all operations.

**Legal operations:** `mint` (if policy allows), `burn` (if policy allows), `set_policy`  
**Illegal:** `transfer`, `split`

**Use case:** Role-based access token where a DAO controls who may hold the badge (e.g., "Validator License"). The validator's JSON Logic policy can enforce `mint` requires governance vote, `burn` requires reason code.

```typescript
const validatorLicense = {
  type: 1,
  holder: "DAGvalidator1",
  policy: {
    // Mint: the DAO address must be among the cryptographic signers of the transaction
    "mint": { "in": ["DAO_ADDRESS", { "map": [{ "var": "proofs" }, { "var": "address" }] }] },
    // Burn: same — DAO must have signed the burn request
    "burn": { "in": ["DAO_ADDRESS", { "map": [{ "var": "proofs" }, { "var": "address" }] }] }
  }
};
// ⚠️ Do NOT use { "var": "event.initiator" } for access control — event payload is user-controlled
// and not cryptographically verified. Always check proofs[] for authorization.
```

---

### Type 2 — Expiring Credential `[-, -, E, -]`

**Behavior:** Soulbound, whole-unit, time-limited, permissionless.

**Legal operations:** `mint`, `burn`, `extend_expiry`, `check_valid`  
**After expiry:** All operations rejected except `burn`

**Use case:** Annual safety certification, seasonal voter registration status.

```typescript
const safetycert = {
  type: 2,
  holder: "DAGworker42",
  amount: 1,
  expiresAtOrdinal: 1_500_000  // ~ordinal deadline; ≈ currentOrdinal + (365days / secsPerSnapshot)
};
// Once $ordinal >= expiresAtOrdinal: transfer → REJECTED, split → REJECTED, merge → REJECTED
// burn after expiry → still allowed (cleanup)
```

---

### Type 3 — Governed Credential `[-, -, E, G]`

**Behavior:** The "license" archetype — soulbound, time-limited, policy-enforced.

**Legal operations:** All of Type 2 + `set_policy`, with all ops subject to policy  
**Key pattern:** `extend_expiry` requires policy approval (issuing authority renews the license)

**Use case:** Professional license, driver's license, export permit. The issuing body (validator) controls renewal via policy, and the credential is non-transferable.

---

### Type 4 — Reputation Score `[-, D, -, -]`

**Behavior:** Soulbound, fractional, permanent, permissionless.

**Legal operations:** `mint`, `burn`, `split`, `merge`  
**Illegal:** `transfer`

**Use case:** Continuous reputation metric that accumulates over time (e.g., agent quality score 0–100.0). Divisible allows incremental updates (+0.5 per successful task).

```typescript
const reputationScore = {
  type: 4,
  holder: "DAGagent7",
  amount: 87.5,   // fractional allowed
  metadata: { dimension: "task_completion_rate" }
};
// split(40.0, 47.5) → valid (restructure internal tracking)
// transfer → REJECTED: reputation is personal
```

---

### Type 5 — Governed Score `[-, D, -, G]`

**Behavior:** Soulbound fractional + policy enforcement on accrual and deduction.

**Use case:** Credit score or trust rating where an authority controls the accrual rate and can cap maximum values via policy. Prevents gaming via self-issuance.

```typescript
// Policy: mint requires SCORING_SERVICE_ADDRESS to be among the transaction signers
const mintPolicy = {
  "and": [
    // Scoring service must have signed this transaction
    { "in": ["SCORING_SERVICE_ADDRESS", { "map": [{ "var": "proofs" }, { "var": "address" }] }] },
    // Single mint cannot exceed 5.0 points
    { "<=": [{ "var": "event.amount" }, 5.0] }
  ]
};
```

---

### Type 6 — Expiring Credits `[-, D, E, -]`

**Behavior:** Soulbound, fractional, time-limited, permissionless.

**Use case:** Seasonal airdrop allocation — 100 tokens granted per quarter, unused credits expire at quarter end. Non-transferable so they can't accumulate into a whale wallet.

---

### Type 7 — Governed Expiring Credits `[-, D, E, G]`

**Behavior:** Full soulbound stack: fractional + expirable + policy enforcement.

**Use case:** Regulated carbon credit quota — allocated by authority, expires at year-end, accrual and burn governed by environmental policy rules.

---

### Type 8 — Pure Collectible (NFT) `[T, -, -, -]`

**Behavior:** Transferable, whole-unit, permanent, permissionless. The OttoChain NFT equivalent.

**Legal operations:** `mint`, `burn`, `transfer`  
**Illegal:** `split` (indivisible)

**Use case:** Digital art, sports trading cards, unique in-game items.

```typescript
const tradingCard = {
  type: 8,
  holder: "DAGcollector1",
  amount: 1,
  metadata: { player: "Shohei Ohtani", season: 2024, serial: 42 }
};
// transfer to DAGcollector2 → ALLOWED
// split → REJECTED: card is whole-unit only
```

---

### Type 9 — Governed Collectible `[T, -, -, G]`

**Behavior:** NFT + validator policy on transfers.

**Use case:** Equity token or restricted security — can be transferred, but only to KYC-verified addresses. Policy checks `event.recipientVerified === true`.

```typescript
const equityToken = {
  type: 9,
  holder: "DAGinvestor1",
  policy: {
    "transfer": {
      "and": [
        { "===": [{ "var": "event.recipientVerified" }, true] },
        { "===": [{ "var": "event.withinJurisdiction" }, true] }
      ]
    }
  }
};
```

---

### Type 10 — Ticket `[T, -, E, -]`

**Behavior:** Transferable, whole-unit, expirable, permissionless.

**Legal operations:** `mint`, `burn`, `transfer` (before expiry), `extend_expiry`  
**After expiry:** `transfer` rejected (can't resell an expired ticket)

**Use case:** Concert ticket, conference pass, parking permit. Can be resold but becomes worthless after the event date.

---

### Type 11 — Governed Ticket `[T, -, E, G]`

**Behavior:** Ticket + policy enforcement.

**Use case:** Airline boarding pass — transferable (with airline approval), expirable (flight date), governed (policy prevents transfer after check-in window).

```typescript
// Policy: transfer requires passenger has not checked in yet
const transferPolicy = { "!": [{ "var": "state.checkedIn" }] };

// Policy: extend_expiry requires the airline address to be among the transaction signers
const extendPolicy = {
  "in": ["AIRLINE_ADDRESS", { "map": [{ "var": "proofs" }, { "var": "address" }] }]
};
```

---

### Type 12 — Fungible Token `[T, D, -, -]`

**Behavior:** Transferable, divisible, permanent, permissionless. The ERC-20 equivalent.

**Legal operations:** `mint`, `burn`, `transfer`, `split`, `merge`

**Use case:** Utility token, simple in-app currency, non-regulated points.

```typescript
const utilityToken = {
  type: 12,
  holder: "DAGwallet1",
  amount: 1500.75,   // fractional
};
// transfer 500.00 to DAGwallet2 → ALLOWED
// split 1500.75 into (750.375, 750.375) → ALLOWED
```

---

### Type 13 — Regulated Token `[T, D, -, G]`

**Behavior:** Full fungible token + validator policy. The stablecoin / security token archetype.

**Use case:** Stablecoin with issuer blacklisting capability, regulated security token requiring KYC on every transfer, DAO treasury token requiring governance approval to mint.

```typescript
const stablecoin = {
  type: 13,
  policy: {
    // Transfer: recipient must not be on the blacklist
    "transfer": { "!": [{ "getKey": [{ "var": "state.blacklist" }, { "var": "event.recipient" }] }] },
    // Mint: the issuer address must be among the cryptographic signers of this operation
    "mint": { "in": ["ISSUER_ADDRESS", { "map": [{ "var": "proofs" }, { "var": "address" }] }] }
  }
};
```

---

### Type 14 — Loyalty Points `[T, D, E, -]`

**Behavior:** Transferable, divisible, expirable, permissionless.

**Use case:** Airline miles (can transfer, fractional redemption, expire after 18 months), subscription credits that expire at period end but can be gifted.

---

### Type 15 — Full-Featured Asset `[T, D, E, G]`

**Behavior:** All four properties active simultaneously. Maximum expressiveness.

**Use case:** Complex financial instrument — a forward contract (expires at settlement date), divisible (partial fills), transferable (secondary market), governed (margin requirements enforced by policy).

This is the most powerful type and also the most complex to design state machines for. Prefer simpler types unless all four properties are genuinely needed.

---

## Type Selection Guide

Use this decision tree to choose the right type:

```
Is the token permanently bound to the original holder?
├── YES (soulbound) → T=0
│   Does it need fractional amounts?
│   ├── YES → D=1
│   │   Does it expire?
│   │   ├── YES → G? → Type 7 (✓G) or Type 6 (✗G)
│   │   └── NO  → G? → Type 5 (✓G) or Type 4 (✗G)
│   └── NO  → D=0
│       Does it expire?
│       ├── YES → G? → Type 3 (✓G) or Type 2 (✗G)
│       └── NO  → G? → Type 1 (✓G) or Type 0 (✗G)
└── NO (transferable) → T=1
    Does it need fractional amounts?
    ├── YES → D=1
    │   Does it expire?
    │   ├── YES → G? → Type 15 (✓G) or Type 14 (✗G)
    │   └── NO  → G? → Type 13 (✓G) or Type 12 (✗G)
    └── NO  → D=0
        Does it expire?
        ├── YES → G? → Type 11 (✓G) or Type 10 (✗G)
        └── NO  → G? → Type 9 (✓G) or Type 8 (✗G)
```

### Quick Selection Table

| "I need a token that..." | Recommended Type |
|--------------------------|-----------------|
| Represents a diploma or achievement that can never be sold | 0 |
| Acts as a DAO role badge with membership control | 1 |
| Certifies annual training completion | 2 |
| Represents a professional license (renewable, non-transferable) | 3 |
| Tracks agent reputation as a continuous score | 4 |
| Tracks credit score controlled by a rating authority | 5 |
| Distributes seasonal airdrop (non-transferable, expires) | 6 or 7 |
| Represents a unique digital collectible (NFT) | 8 |
| Represents an equity token requiring KYC on transfer | 9 |
| Is an event ticket (transferable, expires at event) | 10 |
| Is an airline boarding pass | 11 |
| Functions as an ERC-20 utility token | 12 |
| Functions as a stablecoin or regulated security token | 13 |
| Functions as airline miles or subscription credits | 14 |
| Represents a complex financial instrument | 15 |

---

## Encoding in OttoChain

### TokenBehavior type encoding

```typescript
// In ottochain-sdk TokenBehavior is encoded as a 4-bit integer
// Bits: [T, D, E, G] = [bit3, bit2, bit1, bit0]

export type TokenBehavior = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export const TOKEN_BEHAVIOR_FLAGS = {
  TRANSFERABLE: 0b1000,   // 8
  DIVISIBLE:    0b0100,   // 4
  EXPIRABLE:    0b0010,   // 2
  GOVERNABLE:   0b0001,   // 1
} as const;

export function isTransferable(type: TokenBehavior): boolean {
  return (type & TOKEN_BEHAVIOR_FLAGS.TRANSFERABLE) !== 0;
}
export function isDivisible(type: TokenBehavior): boolean {
  return (type & TOKEN_BEHAVIOR_FLAGS.DIVISIBLE) !== 0;
}
export function isExpirable(type: TokenBehavior): boolean {
  return (type & TOKEN_BEHAVIOR_FLAGS.EXPIRABLE) !== 0;
}
export function isGovernable(type: TokenBehavior): boolean {
  return (type & TOKEN_BEHAVIOR_FLAGS.GOVERNABLE) !== 0;
}

// Compose a type from dimensions
export function makeTokenBehavior(t: boolean, d: boolean, e: boolean, g: boolean): TokenBehavior {
  return ((t ? 8 : 0) | (d ? 4 : 0) | (e ? 2 : 0) | (g ? 1 : 0)) as TokenBehavior;
}

// Examples
const NFT_TYPE:        TokenBehavior = makeTokenBehavior(true, false, false, false);  // 8
const STABLECOIN_TYPE: TokenBehavior = makeTokenBehavior(true, true, false, true);    // 13
const LICENSE_TYPE:    TokenBehavior = makeTokenBehavior(false, false, true, true);   // 3
```

### Operation validation in JSON Logic

```typescript
// JSON Logic guard for transfer operation — rejects if not transferable or expired
const transferGuard = {
  "and": [
    // Must be transferable (bit 3 set)
    { "!==": [{ "&": [{ "var": "state.tokenBehavior" }, 8] }, 0] },
    // Must not be expired (if expirable): $ordinal < state.expiresAtOrdinal
    {
      "or": [
        // Not expirable (bit 1 not set)
        { "===": [{ "&": [{ "var": "state.tokenBehavior" }, 2] }, 0] },
        // Expirable: current ordinal must be less than the expiry ordinal deadline
        { "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
      ]
    }
  ]
};

// JSON Logic guard for mint — if governable, checks that a specific address signed
// ⚠️ Use proofs[], NOT event.initiator — the event payload is user-supplied and unverified
const mintGuard = {
  "or": [
    // Not governable — permit freely
    { "===": [{ "&": [{ "var": "state.tokenBehavior" }, 1] }, 0] },
    // Governable — allowedMinter address must appear in the cryptographic proof signers
    { "in": [
        { "var": "state.policy.allowedMinter" },
        { "map": [{ "var": "proofs" }, { "var": "address" }] }
    ]}
  ]
};
```

### Protobuf representation (planned)

```protobuf
// proto/ottochain/assets/v1/token.proto
syntax = "proto3";

package ottochain.assets.v1;

message Token {
  string id              = 1;
  uint32 behavior        = 2;  // 0–15, encodes TDEG bits
  string holder          = 3;  // DAG address
  string amount          = 4;  // decimal string for divisible, integer for non-divisible
  optional uint64 expires_at_ordinal = 5;  // Snapshot ordinal deadline; only present if E=1
                                           // NOT a Unix timestamp — ordinals are monotone integers
  optional string policy = 6;  // JSON Logic string; only present if G=1
  map<string, string> metadata = 7;
}

message TokenOperation {
  string token_id  = 1;
  string operation = 2;  // "mint" | "burn" | "transfer" | "split" | "merge" | "set_policy" | "extend_expiry"
  // Note: initiator is intentionally absent — authorization is verified via the
  // transaction's cryptographic proofs at consensus time, not a self-reported field.
  // Signers are accessible in JSON Logic via the `proofs` context array.
  map<string, string> params = 3;
}
```

---

## Common Anti-Patterns

### ❌ Using Type 15 when you only need Type 12
If your token just needs to be a fungible currency with no expiry and no governance, Type 12 is correct. Adding governance (G=1) creates a policy that must always be evaluated — unnecessary complexity and gas overhead.

### ❌ Making tokens Governable without defining a policy
If G=1 but no policy is set, every operation is blocked by default (no rule → deny). Always provide a policy when minting G=1 tokens.

### ❌ Using Divisible for tokens meant to be "exactly 1 per person"
Soulbound achievements (Type 0) should have `amount = 1` and be non-divisible. Using D=1 allows fractional minting which breaks the one-per-person invariant.

### ❌ Checking expiry client-side only
Expiry must be enforced in the metagraph's JSON Logic guards, not just in the UI. A client that doesn't check expiry can submit an operation, but the validator will reject it at consensus.

### ❌ Using Unix timestamps for expiry (or expecting `$timestamp`)
The JLVM does **not** expose a `$timestamp` variable. Token expiry must use `expiresAtOrdinal` with the `$ordinal` context variable. Storing a Unix timestamp in a token and trying to compare it with `$timestamp` will always evaluate as falsy (undefined variable), making the guard silently incorrect.

### ❌ Using `event.initiator` for access control
The `event` object is the user-supplied payload — **any caller can set any field to any value**. It provides zero security guarantees. For authorization checks, always use `proofs[]`:
```json
{ "in": ["AUTHORIZED_ADDRESS", { "map": [{ "var": "proofs" }, { "var": "address" }] }] }
```

### ❌ Confusing transfer with delegation
`transfer` permanently changes the holder. Delegating authority to act on a token is a separate concept handled by the delegation framework — the holder address doesn't change.

---

## Runtime Enforcement

The OttoChain metagraph enforces token behavior at the **DataUpdate validation phase** (ML0):

1. **Operation arrives** as a `DataUpdate` containing a `TokenOperation`
2. **Type extraction:** metagraph reads `token.behavior` (0–15)
3. **Structural check:** Is this operation legal for this type? (e.g., `transfer` on T=0 → immediate reject)
4. **Expiry check:** If E=1, is `$ordinal < token.expiresAtOrdinal`? If not → reject. Note: `$ordinal` is the current snapshot ordinal integer, not a Unix timestamp.
5. **Policy evaluation:** If G=1, evaluate token's JSON Logic `policy[operation]` against the JLVM context (which includes `state`, `event`, `proofs`, `$ordinal`, `$epochProgress`, `$lastSnapshotHash`). If result is falsy → reject.
6. **State transition:** If all checks pass, apply the operation to the fiber state

Rejection details are available via the rejection notification webhook system (see `rejection-notifications.md`).

---

*See also: [producer-validator-framework.md](producer-validator-framework.md) | [dfa-json-logic-patterns.md](dfa-json-logic-patterns.md) | [authenticated-tries.md](authenticated-tries.md)*
