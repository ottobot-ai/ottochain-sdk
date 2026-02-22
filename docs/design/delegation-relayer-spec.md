# Delegation Relayer Pattern — TDD-Ready Specification

**Status:** Specification Writing  
**Date:** 2026-02-21  
**Author:** @think (OttoBot)  
**Feasibility:** @research — High ✅ (all 4 open questions answered, key gaps identified)  
**Repos affected:** `ottochain`, `ottochain-sdk`, `ottochain-services`  
**Blocked on (ML0 side):** PR #90 (JLVM Delegation Operators) merge before ownership bypass can be wired in  
**Parent cards:**
- 🔬 Research: Delegated Signing Design Options (699621bd) — this spec
- 📋 Spec: Protobuf schema for delegation structures (699621be) — §3 of this spec
- 🌉 Bridge: Submit delegated transactions endpoint (699621bf250f) — §4 of this spec
- 📦 SDK: Methods for creating and signing delegations (699621c0d648) — §5 of this spec

---

## 1. Architecture Overview

### 1.1 What's Already Built (do not re-implement)

| Component | Status | PR |
|-----------|--------|----|
| `DelegationCredential` on-chain state type | ✅ Specced | proto-schema-delegation-credential.md |
| `CalculatedState.delegations` map | ✅ Specced | Same |
| JLVM delegation context injection (`delegation.*` vars) | ✅ In Review | PR #90 |
| `ContextProvider.buildDelegationContext()` — credential lookup by relayer address | ✅ In Review | PR #90 |
| `DelegationCredential.isActive(ordinal)` — expiry + revocation check | ✅ In Review | PR #90 |
| `DelegationCredential.isRevoked` field | ✅ In Review | PR #90 |
| `Delegation` proto (API-layer, wall-clock timestamps) | ✅ Exists | feat branch |
| `DelegatedTransaction` proto (submission wrapper) | ⚠️ Exists but broken | feat branch |
| `POST /delegation/submit` bridge endpoint | ⚠️ Exists but broken | feat branch |
| `POST /delegation/:id/revoke` bridge endpoint | ⚠️ Exists but broken | feat branch |
| SDK `createDelegation()` method | ✅ In Review | PR #41 |

### 1.2 What This Spec Adds

| Gap | Severity | Section |
|-----|----------|---------|
| Delegation-aware ownership check in ML0 `FiberRules.L0` | 🔴 **Critical** | §2 |
| `REVOKE_DELEGATION` on-chain OttochainMessage | 🔴 **Critical** | §3.1 |
| Bridge `POST /delegation/submit` rewrite (was in-memory mock) | 🔴 **Critical** | §4.1 |
| Bridge `POST /delegation/:id/revoke` rewrite (was in-memory) | 🔴 **Critical** | §4.2 |
| `DelegatedTransaction` proto — clarify payload encoding | 🟡 **High** | §3.2 |
| SDK `revokeDelegation()` and `submitDelegated()` methods | 🟡 **High** | §5 |

### 1.3 Corrected Delegation Submission Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  DELEGATION SUBMISSION FLOW (corrected)                             │
│                                                                      │
│  Relayer holds session key SK (from DelegationCredential)           │
│       │                                                              │
│       ▼                                                              │
│  1. Construct OttochainMessage (e.g., TransitionStateMachine)       │
│       │                                                              │
│       ▼                                                              │
│  2. Bridge: batchSign(message, [SK.privateKey])                     │
│       │  ← uses existing submitTransaction() — no new endpoint       │
│       ▼                                                              │
│  3. DL1: Accept (structural validation passes; SK addr is valid)    │
│       │                                                              │
│       ▼                                                              │
│  4. ML0: validateSignedUpdate(signed_message)                       │
│       │                                                              │
│       ├─ a. ContextProvider: find DelegationCredential where        │
│       │      relayerAddr == proofs.head.address AND isActive(ord)   │
│       │                                                              │
│       ├─ b. ⚠️ NEW: Delegation-aware ownership check               │
│       │      if delegation active: accept IF                        │
│       │        credential.delegatorAddr ∈ fiber.owners              │
│       │      else: apply standard updateSignedByOwners              │
│       │                                                              │
│       ├─ c. JLVM guard evaluation with delegation.* context         │
│       │                                                              │
│       └─ d. Accept → Combiner updates fiber state                   │
│                                                                      │
│  REVOCATION FLOW                                                     │
│                                                                      │
│  Delegator signs RevokeDelegation(delegationId) OttochainMessage    │
│       │                                                              │
│       ▼                                                              │
│  ML0: validate signer == credential.delegatorAddr                   │
│       │                                                              │
│       ▼                                                              │
│  Combiner: CalculatedState.delegations(id).isRevoked = true         │
│       │                                                              │
│       ▼                                                              │
│  All future submissions by relayer are rejected (isActive = false)  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Delegation-Aware Ownership Check (`ottochain`)

**This is the critical gap in PR #90.** The current `FiberRules.L0.updateSignedByOwners` requires:
```scala
signerSet.intersect(record.owners).nonEmpty
```
A relayer (session key holder) is not in `record.owners` — the delegator is. Without a fix, all delegated submissions will fail ownership validation even when the delegation is valid.

### 2.1 Modified Ownership Check Logic

**File:** `modules/l0/src/main/scala/xyz/kd5ujc/l0/FiberRules.scala` (or equivalent ML0 validation location)

```scala
/**
 * Delegation-aware ownership validation.
 * Standard rule: transaction must be signed by an owner.
 * Delegation exception: relayer may sign IF a valid DelegationCredential
 * exists where delegatorAddr ∈ owners AND the credential is active.
 */
def updateSignedByOwnerOrDelegate(
  record:          StateMachineFiberRecord,
  signerSet:       Set[Address],
  calculatedState: CalculatedState,
  currentOrdinal:  Long
): Boolean = {
  // Standard check first (owner signing directly)
  val ownerSigned = signerSet.intersect(record.owners).nonEmpty

  // Delegation check: signer is a relayer with valid credential
  val delegateSigned = signerSet.headOption.exists { signer =>
    calculatedState.delegations.values.exists { cred =>
      cred.relayerAddr == signer.show &&
      cred.isActive(currentOrdinal) &&
      record.owners.contains(Address.fromString(cred.delegatorAddr))
    }
  }

  ownerSigned || delegateSigned
}
```

**Integration point:** Replace `updateSignedByOwners` calls in the fiber update validation path with `updateSignedByOwnerOrDelegate`. This is additive — direct owner-signed txs continue to work unchanged.

### 2.2 Scope Restriction (JLVM Guard Enforcement)

The ownership check above confirms the relayer is authorized for the **fiber** (the delegator is an owner). The JLVM guard evaluation (from PR #90's `buildDelegationContext`) additionally enforces any **policy** the delegator specified when granting the delegation (e.g., `delegation.scope` restrictions, spend limits). Both checks must pass.

ML0 validation order:
1. Structural validation (existing)
2. `updateSignedByOwnerOrDelegate` (§2.1) — **is this relayer authorized for this fiber?**
3. JLVM guard evaluation with `delegation.*` context (PR #90) — **does the action satisfy the delegation policy?**
4. State machine transition rules (existing)

---

## 3. Proto Changes (`ottochain-sdk`)

### 3.1 New: `RevokeDelegation` OttochainMessage

**File:** `proto/updates.proto` (add to existing OttochainMessage oneof and MessageType enum)

```protobuf
// Revokes an active delegation credential on-chain.
// Must be signed by the delegatorAddr of the target DelegationCredential.
// After revocation, isRevoked = true and isActive() = false for all ordinals.
message RevokeDelegation {
  // UUID of the DelegationCredential fiber/record to revoke
  string delegation_id  = 1;

  // Reason for revocation (optional, for audit trail)
  string reason         = 2;
}
```

Add to `MessageType` enum:
```protobuf
REVOKE_DELEGATION = 13;  // next available after DEACTIVATE_AGENT_PROFILE
```

Add to `OttochainMessage.payload` oneof:
```protobuf
RevokeDelegation revoke_delegation = 13;
```

**ML0 Validation for `RevokeDelegation`:**
- Signer must be `credential.delegatorAddr` for the target `delegationId`
- Target credential must exist in `CalculatedState.delegations`
- Already-revoked credential: reject with `DELEGATION_ALREADY_REVOKED`
- Non-existent delegationId: reject with `DELEGATION_NOT_FOUND`

**Combiner handler:**
```scala
case RevokeDelegation(delegationId, reason) =>
  state.delegations.get(delegationId) match {
    case Some(cred) => state.copy(
      delegations = state.delegations.updated(
        delegationId,
        cred.copy(isRevoked = true)
      )
    )
    case None => state // already validated in ML0
  }
```

### 3.2 Revised: `DelegatedTransaction` Proto

The current `DelegatedTransaction.payload: bytes` is too opaque — bridge cannot decode it without type information. **Recommended fix:**

**Option A (preferred — backward compatible):** Add a `message_type` discriminator field:
```protobuf
message DelegatedTransaction {
  string delegation_id    = 1;
  string session_key_id   = 2;
  string operation        = 3;  // human-readable label (unchanged)
  string message_type     = 4;  // NEW: MessageType name, e.g. "TRANSITION_STATE_MACHINE"
  bytes  payload          = 6;  // JSON-encoded OttochainMessage body
  string session_signature = 7;
}
```

**Option B (typed oneof):** Replace `payload: bytes` with `OttochainMessage message = 6`. This is cleaner but requires all OttochainMessage types to be imported. Recommended for v2.

**For the spec, implement Option A.** The bridge can use `message_type` to instantiate the correct handler without changing the wire format for existing callers.

### 3.3 TypeScript Proto Types

Generated from the above protos via ts-proto:

```typescript
export interface RevokeDelegation {
  delegationId: string;  // UUID
  reason:       string;  // optional audit note
}

// Revised DelegatedTransaction
export interface DelegatedTransaction {
  delegationId:      string;
  sessionKeyId:      string;
  operation:         string;
  messageType:       string;  // MessageType discriminator
  payload:           Uint8Array; // JSON-encoded OttochainMessage
  sessionSignature:  string;
}
```

---

## 4. Bridge Endpoint Rewrites (`ottochain-services`)

**⚠️ Both existing delegation endpoints are completely broken** — they use an in-memory `Map<string, Delegation>` and never submit anything on-chain. Both must be fully rewritten.

### 4.1 `POST /delegation/submit` — Rewrite

**Current (broken):** Uses `in-memory Map`, returns `mockTxHash`, never hits metagraph.

**Rewritten spec:**

```
POST /delegation/submit
Content-Type: application/json

Request body:
{
  "delegationId":    "uuid",           // DelegationCredential ID
  "messageType":     "TRANSITION_STATE_MACHINE",  // OttochainMessage type
  "messagePayload":  { ... },          // OttochainMessage body (typed JSON)
  "sessionKeyPrivKey": "hex..."        // relayer's session key private key
                                       // OR "sessionKeyId" for HSM path (future)
}

Success (200):
{
  "txHash":   "sha256hash",
  "status":   "submitted",
  "ordinal":  1234
}

Error (400): Delegation validation failures
Error (404): Delegation not found on-chain
Error (409): Delegation expired or revoked
Error (502): Metagraph submission failure
```

**Implementation logic:**

```typescript
async function submitDelegated(req, res) {
  const { delegationId, messageType, messagePayload, sessionKeyPrivKey } = req.body;

  // 1. Verify delegation exists on-chain (NOT in-memory)
  const checkpoint = await ml0Client.getCheckpoint();
  const cred = checkpoint.calculatedState.delegations[delegationId];
  if (!cred) return res.status(404).json({ error: 'DELEGATION_NOT_FOUND' });
  if (!cred.isActive(checkpoint.ordinal))
    return res.status(409).json({ error: cred.isRevoked ? 'DELEGATION_REVOKED' : 'DELEGATION_EXPIRED' });

  // 2. Construct OttochainMessage from messageType + messagePayload
  const message = buildOttochainMessage(messageType, messagePayload);

  // 3. Sign with session key and submit via existing metagraph client
  const result = await metagraph.submitTransaction(message, sessionKeyPrivKey);

  res.json({ txHash: result.hash, status: 'submitted', ordinal: result.ordinal });
}
```

**Error codes:**

| Code | HTTP | Condition |
|------|------|-----------|
| `DELEGATION_NOT_FOUND` | 404 | `delegationId` not in CalculatedState |
| `DELEGATION_REVOKED` | 409 | `cred.isRevoked == true` |
| `DELEGATION_EXPIRED` | 409 | `currentOrdinal > cred.expiresAtOrdinal` |
| `INVALID_MESSAGE_TYPE` | 400 | `messageType` not a valid OttochainMessage variant |
| `METAGRAPH_SUBMIT_FAILED` | 502 | DL1/ML0 rejected the signed transaction |
| `MISSING_SESSION_KEY` | 400 | `sessionKeyPrivKey` missing or invalid format |

### 4.2 `POST /delegation/:id/revoke` — Rewrite

**Current (broken):** Updates in-memory Map, never hits metagraph.

**Rewritten spec:**

```
POST /delegation/:delegationId/revoke
Content-Type: application/json

Request body:
{
  "delegatorPrivKey": "hex...",  // delegator signs the revocation (proves ownership)
  "reason": "optional string"   // for audit trail in RevokeDelegation proto
}

Success (200):
{
  "txHash":   "sha256hash",
  "status":   "revoked",
  "ordinal":  1235
}

Error (404): Delegation not found
Error (409): Already revoked
Error (403): Signer is not the delegator
```

**Implementation logic:**

```typescript
async function revokeDelegation(req, res) {
  const { delegationId } = req.params;
  const { delegatorPrivKey, reason } = req.body;

  // 1. Verify delegation exists and is active
  const checkpoint = await ml0Client.getCheckpoint();
  const cred = checkpoint.calculatedState.delegations[delegationId];
  if (!cred) return res.status(404).json({ error: 'DELEGATION_NOT_FOUND' });
  if (cred.isRevoked) return res.status(409).json({ error: 'DELEGATION_ALREADY_REVOKED' });

  // 2. Build RevokeDelegation OttochainMessage
  const message = {
    messageType: 'REVOKE_DELEGATION',
    revokeDelegation: { delegationId, reason: reason ?? '' }
  };

  // 3. Sign with DELEGATOR's key (not session key) and submit
  const result = await metagraph.submitTransaction(message, delegatorPrivKey);

  res.json({ txHash: result.hash, status: 'revoked', ordinal: result.ordinal });
}
```

**Note:** The delegator's private key is required here. For production use, this should be done client-side (delegator signs locally, bridge only forwards). A future improvement: accept a pre-signed `RevokeDelegation` transaction directly, eliminating the need for the bridge to hold the delegator's private key.

---

## 5. TypeScript SDK API (`ottochain-sdk`)

**File:** `src/client/delegation-client.ts`

```typescript
export interface DelegationClient {
  /**
   * Submit an OttochainMessage on behalf of a delegator using a session key.
   * The bridge validates the delegation credential on-chain before submission.
   */
  submitDelegated(
    delegationId:     string,
    message:          OttochainMessage,
    sessionKeyWallet: Wallet
  ): Promise<SubmitResult>;

  /**
   * Revoke a delegation credential on-chain.
   * Must be called by the delegator (holder of delegatorPrivKey).
   * After revocation, all future submitDelegated() calls for this delegationId
   * will be rejected.
   */
  revokeDelegation(
    delegationId:     string,
    delegatorWallet:  Wallet,
    reason?:          string
  ): Promise<RevokeResult>;

  /**
   * Query a delegation credential from on-chain state.
   * Returns null if not found.
   */
  getDelegationCredential(
    delegationId: string
  ): Promise<DelegationCredential | null>;

  /**
   * List all active delegations granted BY a delegator address.
   */
  listDelegationsByDelegator(
    delegatorAddress: string
  ): Promise<DelegationCredential[]>;

  /**
   * List all active delegations granted TO a relayer address.
   */
  listDelegationsByRelayer(
    relayerAddress: string
  ): Promise<DelegationCredential[]>;
}

export interface SubmitResult {
  txHash:      string;
  status:      'submitted' | 'pending';
  ordinal:     number;
}

export interface RevokeResult {
  txHash:      string;
  status:      'revoked';
  ordinal:     number;
  revokedAt:   number; // ordinal
}
```

**Note on `createDelegation()`:** Already specced in PR #41 (SDK Delegation Methods, in Code Review). Do not re-implement. The delegation client here extends that work.

---

## 6. ML0 Combiner Changes (`ottochain`)

### 6.1 `RevokeDelegation` handling in Combiner

**File:** `modules/shared-data/src/main/scala/xyz/kd5ujc/shared_data/combiners/DelegationCombiner.scala` (or equivalent)

```scala
case msg: RevokeDelegation =>
  state.delegations.get(UUID.fromString(msg.delegationId)) match {
    case Some(cred) if !cred.isRevoked =>
      state.copy(
        delegations = state.delegations.updated(
          UUID.fromString(msg.delegationId),
          cred.copy(isRevoked = true)
        )
      )
    case Some(_) => state  // already revoked — no change (validation prevented double-revoke)
    case None    => state  // shouldn't happen — validation catches non-existent IDs
  }
```

### 6.2 `Updates.scala` Addition

```scala
// Add to the OttochainMessage sealed trait / ADT:
final case class RevokeDelegation(
  delegationId: UUID,
  reason:       String
) extends OttochainMessage
```

---

## 7. Test Cases (18 total)

### Group 1: Delegation-Aware Ownership Check — ML0 (4 tests)

**Test 1.1: `accepts relayer-signed tx when valid delegation exists`**
- Create fiber with owner=walletA; create DelegationCredential (delegator=walletA, relayer=walletB)  
- Submit TransitionStateMachine signed by walletB (relayer session key)
- Assert: ML0 accepts; fiber transitions successfully
- Assert: `updateSignedByOwnerOrDelegate` returned true (relayer delegation path)

**Test 1.2: `rejects relayer-signed tx when no delegation exists`**
- Create fiber with owner=walletA
- Submit TransitionStateMachine signed by walletB (no delegation for walletB)
- Assert: ML0 rejects with ownership validation error

**Test 1.3: `rejects relayer-signed tx when delegation is expired`**
- Create DelegationCredential with `expiresAtOrdinal=100`; advance ordinal to 101
- Submit signed by relayer
- Assert: ML0 rejects (expired credential → isActive=false → ownership check fails)

**Test 1.4: `direct owner-signed tx still works (regression)`**
- Create fiber with owner=walletA
- Submit signed by walletA directly (no delegation)
- Assert: ML0 accepts (standard ownership check unchanged)

### Group 2: JLVM Guard Enforcement with Delegation (2 tests)

**Test 2.1: `JLVM scope guard blocks relayer from unauthorized operation`**
- Create delegation with scope=`["READ_ONLY"]`; JSON Logic guard: `{"==": [{"var": "delegation.scope"}, "READ_ONLY"]}`
- Relayer submits `UPDATE_PROFILE` (not a read-only operation)
- Guard evaluates: operation not in scope → reject
- Assert: ML0 rejects with JLVM guard failure (not ownership failure)

**Test 2.2: `JLVM spend limit respected`**
- Create delegation with `spendLimit=1000`, `spendUsed=900`
- Relayer submits operation with fee=200 (would exceed limit)
- Assert: ML0 rejects with `SPEND_LIMIT_EXCEEDED`

### Group 3: `RevokeDelegation` On-Chain (4 tests)

**Test 3.1: `RevokeDelegation message sets isRevoked=true in CalculatedState`**
- Create delegation; submit `RevokeDelegation(delegationId)` signed by delegator
- Assert: `CalculatedState.delegations(id).isRevoked == true`

**Test 3.2: `relayer rejected after revocation`**
- Create delegation; relayer submits (succeeds); delegator submits RevokeDelegation
- Relayer attempts second submission after revocation
- Assert: ML0 rejects (isActive=false after revocation)

**Test 3.3: `double revocation rejected`**
- Revoke a delegation twice
- Assert: second revocation rejected with `DELEGATION_ALREADY_REVOKED`

**Test 3.4: `non-delegator cannot revoke`**
- Submit `RevokeDelegation` signed by walletC (neither delegator nor relayer)
- Assert: ML0 rejects with `UNAUTHORIZED_REVOCATION`

### Group 4: Bridge Endpoint — `POST /delegation/submit` (4 tests)

**Test 4.1: `returns 404 when delegationId not in on-chain state`**
- Call `POST /delegation/submit` with unknown delegationId
- Assert: 404 `DELEGATION_NOT_FOUND`

**Test 4.2: `returns 409 when delegation is revoked`**
- Create delegation, revoke on-chain, then attempt submitDelegated
- Assert: 409 `DELEGATION_REVOKED`

**Test 4.3: `successfully submits OttochainMessage via session key`**
- Create valid delegation; call `POST /delegation/submit` with valid session key
- Assert: 200 with txHash; transaction appears in metagraph state

**Test 4.4: `rejects invalid messageType`**
- Call with `messageType: "NOT_A_REAL_MESSAGE"`
- Assert: 400 `INVALID_MESSAGE_TYPE`

### Group 5: Bridge Endpoint — `POST /delegation/:id/revoke` (2 tests)

**Test 5.1: `submits RevokeDelegation on-chain and returns revoked status`**
- Call with valid delegatorPrivKey
- Assert: 200 `{status: "revoked"}`; on-chain credential has `isRevoked=true`

**Test 5.2: `returns 409 if already revoked`**
- Revoke, then revoke again
- Assert: 409 `DELEGATION_ALREADY_REVOKED`

### Group 6: SDK Integration (2 tests)

**Test 6.1: `submitDelegated() succeeds with valid delegation`**
- Call `client.submitDelegated(delegationId, message, sessionKeyWallet)`
- Assert: returns `{txHash, status: "submitted", ordinal}`

**Test 6.2: `revokeDelegation() succeeds and blocks further submissions`**
- Call `client.revokeDelegation(delegationId, delegatorWallet)`
- Assert: subsequent `submitDelegated()` throws with `DELEGATION_REVOKED`

---

## 8. Implementation Sequence

### Phase 1: Core ML0 changes (requires PR #90 merge)
- [ ] Add `RevokeDelegation` to `Updates.scala`
- [ ] Add `RevokeDelegation` handler to Combiner  
- [ ] Modify `FiberRules.L0.updateSignedByOwners` → `updateSignedByOwnerOrDelegate` (§2.1)
- [ ] ML0 validation for `RevokeDelegation` (signer must be delegatorAddr)
- [ ] Tests 1.1–3.4

### Phase 2: Bridge rewrites (can start now, no PR #90 dependency for the bridge logic)
- [ ] Rewrite `POST /delegation/submit` (§4.1)
- [ ] Rewrite `POST /delegation/:id/revoke` (§4.2)
- [ ] Tests 4.1–5.2

### Phase 3: SDK methods (can start now)
- [ ] Add `submitDelegated()` to DelegationClient (§5)
- [ ] Add `revokeDelegation()` to DelegationClient (§5)
- [ ] Tests 6.1–6.2

### Phase 4: Proto updates (can start now, ship with Phase 1 or 2)
- [ ] Add `RevokeDelegation` to `updates.proto` + `MessageType` enum
- [ ] Fix `DelegatedTransaction.message_type` discriminator (§3.2)
- [ ] Regenerate ts-proto types

---

## 9. PR Merge Order

```
PR #90  (JLVM Delegation Operators)     — awaiting James review
PR #41  (SDK Delegation Methods)        — awaiting James review
    │
    ▼
feat/delegation-relayer (this spec)
  ├── Sub-PR A: proto changes (RevokeDelegation + DelegatedTransaction fix)
  ├── Sub-PR B: ML0 ownership bypass + RevokeDelegation Combiner
  ├── Sub-PR C: Bridge endpoint rewrites (can open in parallel with B)
  └── Sub-PR D: SDK submitDelegated() + revokeDelegation() methods
```

**Note:** Sub-PRs B, C, D can be developed in parallel. Sub-PR B requires PR #90 merge; C and D can proceed independently.

---

## 10. Design Decision: Delegator Key in Bridge Revocation

**Issue:** The `POST /delegation/:id/revoke` endpoint (§4.2) currently requires `delegatorPrivKey` in the request body. This means the bridge temporarily holds the delegator's private key — a security concern.

**Preferred pattern (future):** Client-side signing flow:
1. Client fetches the `RevokeDelegation` message structure from bridge: `GET /delegation/:id/revoke-payload`
2. Client signs locally: `batchSign(revokePayload, delegatorPrivKey)`
3. Client submits signed transaction directly: `POST /api/data` with the pre-signed message

For v1 of this spec, the delegatorPrivKey-in-body approach is acceptable given this is an internal tool (OttoBot agents holding their own keys). Document this limitation clearly in the bridge API docs.
