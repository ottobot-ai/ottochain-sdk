# Producer-Validator Framework Architecture

**Status:** Design Draft  
**Author:** @think  
**Date:** 2026-02-19  
**Epic:** [Asset Model App - OttoChain SDK Integration](https://trello.com/c/6988fb33)  
**Trello Card:** [📄 Design Doc: Producer-Validator framework architecture](https://trello.com/c/699630174f13ddb443b76a84)

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Background and Context](#2-background-and-context)
3. [OttoChain Mapping](#3-ottochain-mapping)
4. [Type Model](#4-type-model)
5. [Binding Mechanism](#5-binding-mechanism)
6. [Sequence Diagrams](#6-sequence-diagrams)
7. [Security Considerations](#7-security-considerations)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Open Questions](#9-open-questions)

---

## 1. Problem Statement

### The Double-Signing Bottleneck

In most asset or tokenization systems, every state transition requires both the asset owner (data producer) and the platform/authority (validator) to sign the same message. This creates a fundamental coordination bottleneck:

```
Traditional:
  Producer signs TX → Validator must co-sign → TX submitted → Processed

Problems:
  - Validator availability becomes a single point of failure
  - Batching is awkward (validator must process individually)
  - Ambiguity in who is responsible for incorrect state
  - Producers cannot prove unilateral authenticity of their data
```

### The Goal

Define a framework where **producers** and **validators** have clearly separated, cryptographically verifiable roles:

- A **producer** unilaterally signs their data contribution. Their signature alone proves authenticity and non-repudiation.
- A **validator** independently defines and enforces governance rules over data produced within their scope.
- Neither party needs real-time coordination. The metagraph resolves disputes through policy evaluation.

This design is inspired by the Tokenized Event-Stream Protocol analysis ([@research, 2026-02-08](../../memory/research-context.md)) applied to the OttoChain asset model.

---

## 2. Background and Context

### The Protocol Origin

The producer-validator separation comes from a verifiable append-only event stream protocol designed for complex multi-party tokenized relationships (originally in the professional sports data domain, generalized here).

**Original domain analogy:**
```
Sports Domain          → OttoChain Asset Domain
─────────────────────────────────────────────
Athletes (producers)   → Asset Producers
Teams (validators)     → Asset Validators
Performance Data       → Asset Events / DataUpdates
Collectibles           → Asset Tokens
Roster management      → Portfolio governance
```

### How It Fits OttoChain

OttoChain already has a fiber-based state machine model (`StateMachineDefinition`, `AccessControlPolicy`) and a JSON Logic Virtual Machine (JLVM) for policy evaluation. The producer-validator framework **layers on top of** this existing machinery to answer the question: *who can produce data, and who governs what they can produce?*

---

## 3. OttoChain Mapping

### Existing Role Structure

| OttoChain Concept | Producer-Validator Role | Notes |
|---|---|---|
| Fiber creator (`CreateStateMachine`) | **Validator** sets up the governance context | The SM definition encodes validator policy |
| DataUpdate / `TransitionStateMachine` submitter | **Producer** submits signed events | Subject to SM policy and JLVM guards |
| ML0 validation (metagraph Layer 0) | Neutral enforcer | Applies both JLVM guards AND access-control policy |
| `AccessControlPolicy` (`whitelist`, `fiberOwned`, `public`) | Coarse validator scope | Currently three modes; producer-validator extends this |

### The Gap

The existing `AccessControlPolicy` distinguishes *who can invoke* a fiber, but does not model:
- The **organizational relationship** between producer and validator (e.g., an agreement binding them)
- **Producer-specific proofs**: can validator A certify that producer B is allowed in their scope, without signing each TX?
- **Governance portability**: a validator's policy should follow the asset across fibers/contexts

The Producer-Validator Framework fills this gap.

---

## 4. Type Model

### 4.1 Core Identities

```typescript
/**
 * ProducerIdentity — the entity that generates and signs asset data.
 * Producers prove authenticity; they do NOT define rules.
 */
interface ProducerIdentity {
  /** DAG address (from secp256k1 key pair) */
  address: string;
  /** Optional metadata: name, description, external DID */
  metadata?: Record<string, string>;
}

/**
 * ValidatorIdentity — the entity that governs what producers may do.
 * Validators define policy; they do NOT produce data.
 */
interface ValidatorIdentity {
  /** DAG address of the validator/org */
  address: string;
  /** Human-readable name of this validator scope */
  name: string;
  /** Optional metadata: category, jurisdiction, version */
  metadata?: Record<string, string>;
}
```

### 4.2 The Agreement (Binding)

A `ProducerValidatorAgreement` is the cryptographic bond between a producer and a validator. It grants the producer the right to submit data within the validator's governance scope.

```typescript
/**
 * ProducerValidatorAgreement — the binding contract between a producer and validator.
 * This is signed by BOTH parties (unlike individual data updates which are
 * signed by the producer only).
 */
interface ProducerValidatorAgreement {
  /** Unique agreement ID (hash of content) */
  agreementId: string;

  producer: ProducerIdentity;
  validator: ValidatorIdentity;

  /**
   * The governance scope this agreement covers.
   * Typically maps to one or more fiber IDs or a fiber namespace.
   */
  scope: AgreementScope;

  /** When this agreement was formed (metagraph ordinal) */
  createdAtOrdinal: number;

  /** Optional expiry (metagraph ordinal) */
  expiresAtOrdinal?: number;

  /** The validator's governance policy for this agreement (JSON Logic) */
  policy: JsonLogicExpression;

  /** Producer's signature over the agreement */
  producerSignature: string;

  /** Validator's signature over the agreement (the attestation) */
  validatorSignature: string;
}

interface AgreementScope {
  /** Specific fiber IDs covered, OR... */
  fiberIds?: string[];
  /** ...a namespace pattern (e.g., "asset.sports.*") */
  namespace?: string;
  /** Allowed DataUpdate operations within this scope */
  allowedOperations: string[];
}
```

### 4.3 Proofs

When a producer submits a DataUpdate, they include a `DataProof` asserting their identity. The metagraph uses the `ProducerValidatorAgreement` (retrieved from on-chain state) to verify the producer's right to act.

```typescript
/**
 * DataProof — attached to every DataUpdate to identify the producer.
 * The metagraph verifies this against the active agreement.
 */
interface DataProof {
  /** Which agreement grants this producer's right to submit */
  agreementId: string;

  /** The producer's signature over the DataUpdate payload */
  producerSignature: string;

  /** Producer's DAG address (for quick lookup) */
  producerAddress: string;
}

/**
 * ValidationProof — generated by ML0 after successfully validating a DataUpdate.
 * Stored in the fiber's state history as a receipt.
 */
interface ValidationProof {
  /** The DataUpdate's hash */
  dataUpdateHash: string;

  /** The agreement that authorized this update */
  agreementId: string;

  /** The metagraph ordinal at which validation occurred */
  validatedAtOrdinal: number;

  /** Whether the JLVM policy evaluation passed */
  policyPassed: boolean;

  /** The ML0 node's signature (proves consensus participation) */
  validatorNodeSignature: string;
}
```

### 4.4 Proto Definitions (sketch)

These types map to the following protobuf definitions (to be elaborated in the [Protobuf Schema card](https://trello.com/c/699621bd)):

```protobuf
// proto/ottochain/v1/asset_model.proto

package ottochain.v1;

message ProducerIdentity {
  string address = 1;
  map<string, string> metadata = 2;
}

message ValidatorIdentity {
  string address = 1;
  string name = 2;
  map<string, string> metadata = 3;
}

message AgreementScope {
  repeated string fiber_ids = 1;
  optional string namespace = 2;
  repeated string allowed_operations = 3;
}

message ProducerValidatorAgreement {
  string agreement_id = 1;
  ProducerIdentity producer = 2;
  ValidatorIdentity validator = 3;
  AgreementScope scope = 4;
  uint64 created_at_ordinal = 5;
  optional uint64 expires_at_ordinal = 6;
  bytes policy = 7;                  // JSON Logic serialized
  string producer_signature = 8;
  string validator_signature = 9;
}

message DataProof {
  string agreement_id = 1;
  string producer_signature = 2;
  string producer_address = 3;
}

message ValidationProof {
  string data_update_hash = 1;
  string agreement_id = 2;
  uint64 validated_at_ordinal = 3;
  bool policy_passed = 4;
  string validator_node_signature = 5;
}
```

---

## 5. Binding Mechanism

### 5.1 Agreement Formation (Two-Phase)

The agreement between producer and validator is formed off-chain and then registered on-chain via a dedicated DataUpdate:

```
Phase 1: Off-Chain Negotiation
  ┌──────────┐                         ┌───────────┐
  │ Producer │                         │ Validator │
  └────┬─────┘                         └─────┬─────┘
       │  "I want to produce data in          │
       │   your governance scope"             │
       │ ─────────────────────────────────► │
       │                                     │
       │  "Here are my policy terms (JSON    │
       │   Logic). Sign this agreement."     │
       │ ◄───────────────────────────────── │
       │                                     │
       │  Producer signs agreement           │
       │ ─────────────────────────────────► │
       │                                     │
       │  Validator counter-signs            │
       │ ◄───────────────────────────────── │

Phase 2: On-Chain Registration
  Producer OR Validator submits RegisterAgreement DataUpdate to ML0
  ML0 validates both signatures → stores agreement in fiber state
  Agreement is now active; Producer may begin submitting data
```

### 5.2 Cryptographic Attestation

The agreement's authenticity rests on secp256k1 signatures (OttoChain's standard key scheme):

```
agreement_id  = SHA3-256(concat(producer.address, validator.address, scope_hash, policy_hash, nonce))

producer_sig  = secp256k1.sign(agreement_id, producer_private_key)
validator_sig = secp256k1.sign(agreement_id, validator_private_key)
```

The `agreement_id` is a hash of all material terms — changing any field invalidates both signatures.

### 5.3 DataUpdate Submission Flow

Once an agreement is active, the producer submits DataUpdates with an attached `DataProof`:

```
DataUpdate {
  fiberId: "sports.asset.abc123",
  event: { type: "performance_score", value: 98.7, ... },
  proof: DataProof {
    agreementId: "agg_xyz",
    producerAddress: "DAGproducerAddr...",
    producerSignature: "sig_over_event_payload"
  },
  targetSequenceNumber: 42
}
```

ML0 validation:
1. Resolve `agreementId` from fiber state → load `ProducerValidatorAgreement`
2. Verify `producerSignature` against `proof.producerAddress`
3. Verify `producerAddress == agreement.producer.address`
4. Check agreement is not expired
5. Evaluate `agreement.policy` (JSON Logic) against DataUpdate payload via JLVM
6. If all pass → accept update; emit `ValidationProof` into fiber state

### 5.4 Agreement Revocation

Either party may revoke the agreement:

```
RevokeAgreement DataUpdate {
  agreementId: "agg_xyz",
  revokerAddress: "DAGvalidatorAddr...",
  revokerSignature: sig_over("REVOKE:agg_xyz:ordinal"),
  reason: "policy_violation"  // optional
}
```

After revocation, any DataUpdate referencing `agg_xyz` is rejected by ML0 with `AGREEMENT_REVOKED`.

---

## 6. Sequence Diagrams

### 6.1 Create Flow (Happy Path)

```
Producer          Validator         ML0 (metagraph)       Fiber State
   │                  │                    │                    │
   │ ── negotiate ──► │                    │                    │
   │ ◄── policy ───── │                    │                    │
   │ ── sign ───────► │                    │                    │
   │ ◄── counter-sig ─│                    │                    │
   │                  │                    │                    │
   │ ──── RegisterAgreement DataUpdate ──► │                    │
   │                  │     validate sigs  │                    │
   │                  │                   │─── store agreement ►│
   │ ◄────────────── OK (ordinal N) ───── │                    │
   │                  │                    │                    │
   │ ─── DataUpdate (with DataProof) ────► │                    │
   │                  │   resolve agg      │◄─── load agreement ─│
   │                  │   verify sig       │                    │
   │                  │   eval policy      │                    │
   │                  │   (JLVM)           │                    │
   │                  │                   │─── store ValidationProof ►│
   │ ◄────────────── OK (ordinal N+1) ─── │                    │
```

### 6.2 Validate Flow (Policy Rejected)

```
Producer          ML0 (metagraph)         Fiber State
   │                    │                      │
   │ ─── DataUpdate ──► │                      │
   │                   │◄─── load agreement ── │
   │                   │  resolve agreementId  │
   │                   │  verify producerSig ✓ │
   │                   │  evaluate policy ✗    │
   │                   │  (JLVM returns false)  │
   │ ◄── REJECTED ───── │                      │
   │     reason:        │                      │
   │     POLICY_FAILED  │                      │
```

### 6.3 Reject Flow (Revoked Agreement)

```
Validator         ML0 (metagraph)         Fiber State
   │                    │                      │
   │ ─── RevokeAgreement ► │                   │
   │                   │  verify validator sig │
   │                   │─── mark revoked ────► │
   │ ◄── OK ────────── │                      │

  [Later:]
Producer                ML0
   │ ─── DataUpdate ──► │
   │                   │ check agreement → REVOKED
   │ ◄── REJECTED ───── │
   │     reason:        │
   │     AGREEMENT_REVOKED
```

---

## 7. Security Considerations

### 7.1 Spoofing (Producer Impersonation)

**Attack**: Mallory submits a DataUpdate claiming to be Producer Alice.

**Defense**: The `DataProof.producerSignature` is a signature over the DataUpdate payload with Alice's private key. Without Alice's private key, Mallory cannot produce a valid signature. ML0 rejects the update at signature verification.

**Additional hardening**: The `agreementId` in the DataProof must resolve to an active agreement where `producer.address == proof.producerAddress`. A valid signature from a random address doesn't help without a registered agreement.

### 7.2 Replay Attacks

**Attack**: Mallory captures a valid DataUpdate from Producer Alice and replays it.

**Defense**: Every DataUpdate includes `targetSequenceNumber` (the fiber's current ordinal). ML0 rejects any update whose `targetSequenceNumber` does not match the actual current ordinal. A replayed update is always stale.

### 7.3 Agreement Forgery

**Attack**: Mallory creates a fake agreement claiming Validator Bob sponsors her.

**Defense**: The agreement requires *both* producer and validator signatures. Mallory cannot produce `validatorSignature` without Bob's private key. ML0 verifies both signatures during `RegisterAgreement`.

### 7.4 Key Compromise

**Attack**: Producer Alice's private key is compromised.

**Defense**:
1. Validator revokes the agreement via `RevokeAgreement` signed by validator key
2. Producer registers new key via identity service, forms new agreement
3. Optionally: agreements can have short `expiresAtOrdinal` for time-bounded scopes

**Gap**: If the *validator* key is compromised, the attacker can revoke legitimate agreements and register fraudulent ones. This is addressed by:
- Validators should use multi-sig or hardware-secured keys
- Agreement history is immutable on-chain; fraudulent registrations are detectable
- Future: threshold signature schemes for validator identity

### 7.5 Policy Bypass via Malicious JSON Logic

**Attack**: A validator constructs a JSON Logic policy that always evaluates to `true`, bypassing data quality checks.

**Defense**: This is by design — validators define their own policy. If a validator accepts all data, that's their governance choice. The framework provides the enforcement mechanism; it doesn't mandate *what* to enforce. For sensitive assets, James/platform governance can require policy audits before validator registration.

### 7.6 Denial of Service (Revocation Spam)

**Attack**: Validator rapidly creates and revokes agreements to exhaust producer resources.

**Defense**: Agreement operations consume metagraph transaction fees (DAG). Excessive revocations have a cost. Rate limiting per validator address can be added as a JLVM policy at the platform level.

---

## 8. Implementation Roadmap

This document informs the following implementation cards (all in Requirements → Specification → TDD pipeline):

| Card | Type | Depends On | Assigned |
|------|------|------------|---------|
| [📋 Spec: Protobuf schema for delegation structures](https://trello.com/c/699621bd) | Spec | Research (design option chosen) | @think |
| [🏗️ SDK: Producer-Validator framework Scala abstractions](https://trello.com/c/699630149b7caf2bb3b318f8) | Impl | This design doc | @work |
| [🎲 SDK: 16-type token behavior matrix implementation](https://trello.com/c/6996301447b41cda59369256) | Impl | This design doc | @work |
| [📐 Proto: Define canonical proto schemas](https://trello.com/c/699621e02b30219827052ee1) | Spec | This design doc | @think |

### Suggested Implementation Order

```
1. Proto schema definitions (ottochain-sdk/proto/)
     ↓
2. ScalaPB codegen + TypeScript ts-proto codegen
     ↓
3. ProducerValidatorAgreement lifecycle (register, revoke)
     ↓
4. ML0 validation hook: agreement resolution + policy eval
     ↓
5. DataProof verification in fiber update path
     ↓
6. ValidationProof emission + storage
     ↓
7. Integration tests: full create/validate/reject flows
     ↓
8. SDK helper methods: createAgreement(), revokeAgreement()
```

---

## 9. Open Questions

| # | Question | Stakeholder | Priority |
|---|----------|-------------|---------|
| Q1 | Should `RegisterAgreement` be a new message type in `OttochainMessage`, or is it a fiber creation (`CreateStateMachine`)? | @work, James | High |
| Q2 | How does agreement state interact with Constellation metagraph snapshots? Is agreement data in `calculatedState` or `onChainState`? | @work | High |
| Q3 | Should agreements be scoped to individual fibers or to namespaces (e.g., all fibers owned by a validator)? | James | Medium |
| Q4 | How does this interact with the existing `AccessControlPolicy` (whitelist/fiberOwned/public)? Replace it? Layer on top? | @work | High |
| Q5 | Do we need a revocation registry separate from fiber state, for cross-fiber revocation queries? | @research | Medium |
| Q6 | Multi-party agreements (N producers, 1 validator vs. 1 producer, M validators)? | James | Low |

---

## References

- [Tokenized Event-Stream Protocol Analysis (@research, 2026-02-08)](../../memory/archive/2026-02-08-tokenized-streams-analysis.md)
- [Token Behavior Matrix Spec (token-behavior-matrix.md)](./token-behavior-matrix.md)
- [Asset Model Epic (Trello)](https://trello.com/c/6988fb33)
- [DFA + JSON Logic Patterns Spec (sibling doc)](./dfa-json-logic-patterns.md) ← *pending*
- OttoChain existing types: `src/generated/ottochain/v1/messages.ts`, `fiber.ts`

---

*Design document by @think agent. Comments/corrections welcome via Trello card.*
