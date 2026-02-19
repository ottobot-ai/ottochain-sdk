# Producer-Validator Framework: Technical Specification

**Status:** Specification — Ready for TDD  
**Author:** @think  
**Date:** 2026-02-19  
**Preceded by:** [Design Doc](./producer-validator-framework.md) | [Feasibility (@research)](./producer-validator-framework.md)  
**Epic:** [Asset Model App - OttoChain SDK Integration](https://trello.com/c/6988fb33)  
**Trello Card:** [📄 Design Doc: Producer-Validator framework architecture](https://trello.com/c/699630174f13ddb443b76a84)

---

## Decision Log

### Q1: How does `RegisterAgreement` flow into the metagraph?

**Decision:** `RegisterAgreement` and `RevokeAgreement` are **new `OttochainMessage` oneof variants** (field numbers 6 and 7).

**Rationale:**  
- Agreement lifecycle is a metagraph state change (like `CreateStateMachine`) — it needs ML0 consensus.  
- The existing `DelegationService` in `delegation.proto` is a bridge-layer RPC service for user→agent session keys. That is a different concern (delegated signing) from producer→validator governance relationships (asset model).  
- Adding fields 6/7 to `OttochainMessage` preserves backward compatibility; existing variants are untouched.  
- Alternatives considered: (a) a new dedicated fiber type — rejected (adds routing complexity); (b) bridge-only (no metagraph) — rejected (agreements need consensus guarantee).

### Q2: Where does agreement state live?

**Decision:**  
- `ProducerValidatorAgreement` records → `calculatedState` (fast HashMap lookup by `agreementId`)  
- `ValidationProof` receipts → `onChainState` (immutable, part of snapshot)  
- Agreement index by producer address → `calculatedState` (secondary index for queries)

### Q3: Scope model

**Decision:** Scope is **validator-namespace-first** with optional fiber-level restrictions.  
- Every active agreement implicitly covers all fibers owned by the validator, unless `fiberIds` is set.  
- `allowedOperations` restricts which `eventName` strings are valid in `TransitionStateMachine`.

### Q4: Interaction with existing `AccessControlPolicy`

**Decision:** **Layer on top, not replace.**  
- A fiber can require `AccessControlPolicy { whitelist: [...] }` AND a `ProducerValidatorAgreement`.  
- If both are set, ML0 checks: whitelist passes AND agreement is active AND policy (JSON Logic) passes.  
- If no agreement is found for a DataUpdate that targets an asset-model fiber, ML0 rejects with `AGREEMENT_REQUIRED`.

---

## Table of Contents

1. [Proto Definitions](#1-proto-definitions)
2. [Updated OttochainMessage](#2-updated-ottochainmessage)
3. [TypeScript Interfaces](#3-typescript-interfaces)
4. [Metagraph Validation Logic](#4-metagraph-validation-logic)
5. [Error Codes](#5-error-codes)
6. [Agreement Lifecycle State Machine](#6-agreement-lifecycle-state-machine)
7. [SDK API Contract](#7-sdk-api-contract)
8. [Bridge REST Endpoints](#8-bridge-rest-endpoints)
9. [Test Scenarios](#9-test-scenarios)

---

## 1. Proto Definitions

### New file: `proto/ottochain/apps/asset_model/v1/asset_model.proto`

```protobuf
syntax = "proto3";

package ottochain.apps.asset_model.v1;

import "google/protobuf/struct.proto";
import "ottochain/v1/common.proto";

option java_package = "xyz.kd5ujc.shared_data.apps.asset_model.v1";
option java_outer_classname = "AssetModelProto";

// ─────────────────────────────────────────────────────────────────────────────
// Core Identities
// ─────────────────────────────────────────────────────────────────────────────

// ProducerIdentity — the entity that generates and signs asset data.
// Producers prove authenticity; they do NOT define governance rules.
message ProducerIdentity {
  string address = 1;                       // DAG address (secp256k1 public key)
  map<string, string> metadata = 2;         // Optional: name, description, external DID
}

// ValidatorIdentity — the entity that governs what producers may do.
// Validators define policy; they do NOT produce data.
message ValidatorIdentity {
  string address = 1;                       // DAG address
  string name = 2;                          // Human-readable name (required)
  map<string, string> metadata = 3;         // Optional: category, jurisdiction, version
}

// ─────────────────────────────────────────────────────────────────────────────
// Agreement
// ─────────────────────────────────────────────────────────────────────────────

// AgreementScope — defines what operations a producer may perform.
message AgreementScope {
  // Optional: restrict to specific fiber IDs.
  // If empty, producer can operate on ALL fibers owned by validator.
  repeated string fiber_ids = 1;

  // Optional: namespace pattern (e.g. "asset.sports.*").
  // Matched as a prefix against fiber_id.
  optional string namespace = 2;

  // Allowed TransitionStateMachine event names.
  // If empty, all events are allowed.
  repeated string allowed_operations = 3;
}

// AgreementStatus — lifecycle of a ProducerValidatorAgreement.
enum AgreementStatus {
  AGREEMENT_STATUS_UNSPECIFIED = 0;
  AGREEMENT_STATUS_ACTIVE = 1;      // Valid and usable
  AGREEMENT_STATUS_EXPIRED = 2;     // Past expires_at_ordinal
  AGREEMENT_STATUS_REVOKED = 3;     // Revoked by either party
}

// ProducerValidatorAgreement — the cryptographic binding between producer and validator.
// Registered on-chain via RegisterAgreement DataUpdate.
// Requires signatures from BOTH parties.
message ProducerValidatorAgreement {
  // Stable ID: SHA3-256(producer_address || validator_address || scope_hash || policy_hash || nonce)
  string agreement_id = 1;

  ProducerIdentity producer = 2;
  ValidatorIdentity validator = 3;
  AgreementScope scope = 4;

  // When this agreement was registered (metagraph ordinal, set by ML0)
  uint64 created_at_ordinal = 5;

  // Optional expiry. 0 means no expiry.
  uint64 expires_at_ordinal = 6;

  // JSON Logic policy governing producer's data submissions.
  // Serialized as UTF-8 JSON bytes.
  bytes policy = 7;

  // Producer's secp256k1 signature over agreement_id
  string producer_signature = 8;

  // Validator's secp256k1 signature over agreement_id
  string validator_signature = 9;

  // Nonce (included in agreement_id hash; prevents replay)
  uint64 nonce = 10;

  AgreementStatus status = 11;  // Set by metagraph; not trusted from submitter
}

// ─────────────────────────────────────────────────────────────────────────────
// DataUpdate attachment types
// ─────────────────────────────────────────────────────────────────────────────

// DataProof — attached to TransitionStateMachine DataUpdates in asset-model fibers.
// Identifies the producer and links their authority to an active agreement.
message DataProof {
  string agreement_id = 1;              // Resolves to a ProducerValidatorAgreement
  string producer_address = 2;          // Must match agreement.producer.address
  string producer_signature = 3;        // secp256k1 sig over SHA3-256(fiber_id || event_name || payload_hash || target_sequence_number)
}

// ValidationProof — emitted by ML0 after successful DataUpdate validation.
// Stored in onChainState as an immutable receipt.
message ValidationProof {
  string data_update_hash = 1;          // Hash of the validated DataUpdate
  string agreement_id = 2;             // Agreement that authorized this update
  uint64 validated_at_ordinal = 3;      // Metagraph ordinal at validation time
  bool policy_passed = 4;              // Result of JLVM policy evaluation
  string ml0_node_address = 5;         // Validating node's DAG address (for audit)
}

// ─────────────────────────────────────────────────────────────────────────────
// OttochainMessage payload types (for fields 6 and 7)
// ─────────────────────────────────────────────────────────────────────────────

// RegisterAgreement — creates a new ProducerValidatorAgreement on-chain.
// Both signatures must be present and valid.
// After successful processing, agreement.status = ACTIVE.
message RegisterAgreement {
  ProducerValidatorAgreement agreement = 1;
}

// RevokeAgreement — marks an agreement as REVOKED.
// Either the producer or validator may revoke.
// After successful processing, agreement.status = REVOKED.
message RevokeAgreement {
  string agreement_id = 1;

  // Address of the revoker (must be producer.address OR validator.address)
  string revoker_address = 2;

  // secp256k1 sig over SHA3-256("REVOKE" || agreement_id || revocation_ordinal || nonce)
  string revoker_signature = 3;

  // Current metagraph ordinal (replay protection)
  uint64 revocation_ordinal = 4;

  // Nonce (replay protection within same ordinal)
  uint64 nonce = 5;

  // Optional: human-readable reason (not validated, for audit purposes)
  optional string reason = 6;
}
```

---

## 2. Updated OttochainMessage

**File:** `proto/ottochain/v1/messages.proto`

Add the following import and extend the `OttochainMessage` oneof:

```protobuf
import "ottochain/apps/asset_model/v1/asset_model.proto";

message OttochainMessage {
  oneof message {
    // Existing variants (fields 1–5 MUST NOT be renumbered)
    CreateStateMachine create_state_machine = 1;
    TransitionStateMachine transition_state_machine = 2;
    ArchiveStateMachine archive_state_machine = 3;
    CreateScript create_script = 4;
    InvokeScript invoke_script = 5;

    // Asset Model: Agreement lifecycle (fields 6–7)
    ottochain.apps.asset_model.v1.RegisterAgreement register_agreement = 6;
    ottochain.apps.asset_model.v1.RevokeAgreement revoke_agreement = 7;
  }
}
```

**Wire compatibility:** Existing parsers ignore unknown fields. Fields 1–5 are unchanged. ✅

---

## 3. TypeScript Interfaces

### File: `src/asset-model/types.ts` (new)

```typescript
import type { Address, FiberId, FiberOrdinal, HashValue } from "../types.js";

// ─── Identities ──────────────────────────────────────────────────────────────

export interface ProducerIdentity {
  address: Address;
  metadata?: Record<string, string>;
}

export interface ValidatorIdentity {
  address: Address;
  name: string;
  metadata?: Record<string, string>;
}

// ─── Agreement ───────────────────────────────────────────────────────────────

export interface AgreementScope {
  /** Specific fibers. Empty = all fibers owned by validator */
  fiberIds?: FiberId[];
  /** Prefix namespace pattern (optional) */
  namespace?: string;
  /** Allowed TransitionStateMachine eventNames. Empty = all */
  allowedOperations?: string[];
}

export type AgreementStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export interface ProducerValidatorAgreement {
  agreementId: HashValue;               // SHA3-256 of material terms
  producer: ProducerIdentity;
  validator: ValidatorIdentity;
  scope: AgreementScope;
  createdAtOrdinal: FiberOrdinal;       // Set by metagraph on registration
  expiresAtOrdinal?: FiberOrdinal;      // 0 or absent = no expiry
  policy: string;                       // JSON Logic expression (stringified JSON)
  producerSignature: string;            // secp256k1 hex signature
  validatorSignature: string;           // secp256k1 hex signature
  nonce: number;
  status: AgreementStatus;             // Set by metagraph; read-only for clients
}

// ─── DataUpdate attachment ────────────────────────────────────────────────────

export interface DataProof {
  agreementId: HashValue;
  producerAddress: Address;
  producerSignature: string;           // sig over SHA3-256(fiberId + eventName + payloadHash + targetSeqNum)
}

export interface ValidationProof {
  dataUpdateHash: HashValue;
  agreementId: HashValue;
  validatedAtOrdinal: FiberOrdinal;
  policyPassed: boolean;
  ml0NodeAddress: Address;
}

// ─── OttochainMessage payloads ────────────────────────────────────────────────

export interface RegisterAgreementMessage {
  agreement: ProducerValidatorAgreement;
}

export interface RevokeAgreementMessage {
  agreementId: HashValue;
  revokerAddress: Address;
  revokerSignature: string;            // sig over SHA3-256("REVOKE" + agreementId + revocationOrdinal + nonce)
  revocationOrdinal: FiberOrdinal;
  nonce: number;
  reason?: string;
}

// ─── Agreement computation helpers ───────────────────────────────────────────

/**
 * Canonical input for agreement_id computation.
 * Fields must be concatenated in this exact order.
 */
export interface AgreementIdInput {
  producerAddress: Address;
  validatorAddress: Address;
  scopeHash: HashValue;                // SHA3-256(JSON.stringify(scope, sorted keys))
  policyHash: HashValue;               // SHA3-256(policy string)
  nonce: number;
}

/**
 * Canonical input for DataProof signature.
 */
export interface DataProofSignatureInput {
  fiberId: FiberId;
  eventName: string;
  payloadHash: HashValue;              // SHA3-256(JSON.stringify(payload, sorted keys))
  targetSequenceNumber: number;
}

/**
 * Canonical input for RevokeAgreement signature.
 */
export interface RevocationSignatureInput {
  prefix: "REVOKE";                    // Literal string "REVOKE"
  agreementId: HashValue;
  revocationOrdinal: FiberOrdinal;
  nonce: number;
}
```

---

## 4. Metagraph Validation Logic

This section specifies what ML0 MUST verify for each new message variant. This is the contract for Scala implementation and for test expectations.

### 4.1 `RegisterAgreement` validation (ordered steps)

ML0 validates in this exact order. First failure stops processing and returns error.

| Step | Check | Error on Failure |
|------|-------|-----------------|
| 1 | `agreement` field is present | `INVALID_ARGUMENT` |
| 2 | `agreement.agreement_id` is non-empty | `INVALID_ARGUMENT` |
| 3 | `agreement.producer.address` is valid DAG address | `INVALID_PRODUCER_ADDRESS` |
| 4 | `agreement.validator.address` is valid DAG address | `INVALID_VALIDATOR_ADDRESS` |
| 5 | `agreement.validator.name` is non-empty | `INVALID_ARGUMENT` |
| 6 | Recompute expected `agreement_id` from fields; must match provided value | `AGREEMENT_ID_MISMATCH` |
| 7 | No existing agreement with same `agreement_id` in `calculatedState` | `AGREEMENT_ALREADY_EXISTS` |
| 8 | Verify `agreement.producer_signature` is valid secp256k1 sig by `producer.address` over `agreement_id` | `INVALID_PRODUCER_SIGNATURE` |
| 9 | Verify `agreement.validator_signature` is valid secp256k1 sig by `validator.address` over `agreement_id` | `INVALID_VALIDATOR_SIGNATURE` |
| 10 | If `expires_at_ordinal > 0`, then `expires_at_ordinal > current_ordinal` | `AGREEMENT_ALREADY_EXPIRED` |
| 11 | If `scope.fiber_ids` is non-empty, verify each `fiber_id` is a valid UUID | `INVALID_SCOPE_FIBER_ID` |
| 12 | `policy` bytes are valid UTF-8 JSON (must be parseable as JSON object or literal) | `INVALID_POLICY_JSON` |
| ✅ | Store agreement with `status = ACTIVE`, `created_at_ordinal = current_ordinal` | — |

### 4.2 `RevokeAgreement` validation

| Step | Check | Error on Failure |
|------|-------|-----------------|
| 1 | `agreement_id` is non-empty | `INVALID_ARGUMENT` |
| 2 | `revoker_address` is valid DAG address | `INVALID_REVOKER_ADDRESS` |
| 3 | Lookup agreement by `agreement_id` in `calculatedState` | `AGREEMENT_NOT_FOUND` |
| 4 | `agreement.status == ACTIVE` | `AGREEMENT_NOT_ACTIVE` |
| 5 | `revoker_address == agreement.producer.address` OR `revoker_address == agreement.validator.address` | `UNAUTHORIZED_REVOKER` |
| 6 | `revocation_ordinal == current_ordinal` (exact match — prevents stale revocations) | `INVALID_REVOCATION_ORDINAL` |
| 7 | Verify `revoker_signature` over `SHA3-256("REVOKE" \|\| agreement_id \|\| revocation_ordinal \|\| nonce)` by `revoker_address` | `INVALID_REVOKER_SIGNATURE` |
| 8 | Nonce not seen before for this `revoker_address` in current snapshot | `NONCE_ALREADY_USED` |
| ✅ | Update agreement `status = REVOKED` in `calculatedState` | — |

### 4.3 `TransitionStateMachine` with `DataProof` (asset-model fibers)

A `TransitionStateMachine` targeting an asset-model fiber (identified by a validator-owned namespace or explicit agreement scope) MUST include a `DataProof` in its `payload` under the key `"__proof"`.

| Step | Check | Error on Failure |
|------|-------|-----------------|
| 1 | `payload["__proof"]` is present and parseable as `DataProof` | `PROOF_REQUIRED` |
| 2 | `proof.agreement_id` is non-empty | `INVALID_ARGUMENT` |
| 3 | Lookup agreement by `proof.agreement_id` | `AGREEMENT_NOT_FOUND` |
| 4 | `agreement.status == ACTIVE` | `AGREEMENT_NOT_ACTIVE` |
| 5 | `proof.producer_address == agreement.producer.address` | `PRODUCER_MISMATCH` |
| 6 | If `agreement.expires_at_ordinal > 0`, then `current_ordinal <= agreement.expires_at_ordinal` | `AGREEMENT_EXPIRED` |
| 7 | If `agreement.scope.fiber_ids` non-empty, `fiber_id` must be in `scope.fiber_ids` | `SCOPE_FIBER_VIOLATION` |
| 8 | If `agreement.scope.allowed_operations` non-empty, `event_name` must be in `allowed_operations` | `SCOPE_OPERATION_VIOLATION` |
| 9 | Recompute `DataProof` signature input: `SHA3-256(fiber_id \|\| event_name \|\| payload_hash \|\| target_sequence_number)` | — |
| 10 | Verify `proof.producer_signature` over computed hash by `proof.producer_address` | `INVALID_PRODUCER_SIGNATURE` |
| 11 | Evaluate `agreement.policy` (JSON Logic) against payload (minus `__proof` key) via JLVM | `POLICY_EVALUATION_FAILED` |
| ✅ | Accept update; emit `ValidationProof` into `onChainState`; apply state transition | — |

**Note on asset-model fiber detection:** A fiber is an "asset-model fiber" if its `StateMachineDefinition` includes a metadata key `"asset_model": "true"` in its `initialData`. This flag is set at `CreateStateMachine` time and is immutable.

---

## 5. Error Codes

All errors are returned as Constellation metagraph `DataUpdateRejection` with a typed `reason` string. The Scala metagraph uses a sealed trait; the bridge/SDK sees these as strings.

```typescript
// src/asset-model/errors.ts

export type AssetModelErrorCode =
  // RegisterAgreement errors
  | "INVALID_PRODUCER_ADDRESS"
  | "INVALID_VALIDATOR_ADDRESS"
  | "AGREEMENT_ID_MISMATCH"
  | "AGREEMENT_ALREADY_EXISTS"
  | "INVALID_PRODUCER_SIGNATURE"
  | "INVALID_VALIDATOR_SIGNATURE"
  | "AGREEMENT_ALREADY_EXPIRED"
  | "INVALID_SCOPE_FIBER_ID"
  | "INVALID_POLICY_JSON"

  // RevokeAgreement errors
  | "AGREEMENT_NOT_FOUND"
  | "AGREEMENT_NOT_ACTIVE"
  | "UNAUTHORIZED_REVOKER"
  | "INVALID_REVOCATION_ORDINAL"
  | "INVALID_REVOKER_SIGNATURE"
  | "INVALID_REVOKER_ADDRESS"
  | "NONCE_ALREADY_USED"

  // TransitionStateMachine (asset-model) errors
  | "PROOF_REQUIRED"
  | "AGREEMENT_NOT_ACTIVE"      // (also used here)
  | "PRODUCER_MISMATCH"
  | "AGREEMENT_EXPIRED"
  | "SCOPE_FIBER_VIOLATION"
  | "SCOPE_OPERATION_VIOLATION"
  | "POLICY_EVALUATION_FAILED"

  // Generic
  | "INVALID_ARGUMENT";

export interface AssetModelRejection {
  code: AssetModelErrorCode;
  message: string;              // Human-readable description
  field?: string;               // Which field caused the error (if applicable)
}
```

### Scala sealed trait (reference for @work)

```scala
sealed trait AssetModelError extends DataUpdateRejection

object AssetModelError {
  // RegisterAgreement
  case class InvalidProducerAddress(address: String) extends AssetModelError
  case class InvalidValidatorAddress(address: String) extends AssetModelError
  case object AgreementIdMismatch extends AssetModelError
  case class AgreementAlreadyExists(id: String) extends AssetModelError
  case object InvalidProducerSignature extends AssetModelError
  case object InvalidValidatorSignature extends AssetModelError
  case object AgreementAlreadyExpired extends AssetModelError
  case class InvalidScopeFiberId(fiberId: String) extends AssetModelError
  case object InvalidPolicyJson extends AssetModelError

  // RevokeAgreement
  case class AgreementNotFound(id: String) extends AssetModelError
  case object AgreementNotActive extends AssetModelError
  case class UnauthorizedRevoker(address: String) extends AssetModelError
  case object InvalidRevocationOrdinal extends AssetModelError
  case object InvalidRevokerSignature extends AssetModelError
  case object InvalidRevokerAddress extends AssetModelError
  case object NonceAlreadyUsed extends AssetModelError

  // TransitionStateMachine (asset model)
  case object ProofRequired extends AssetModelError
  case object ProducerMismatch extends AssetModelError
  case object AgreementExpired extends AssetModelError
  case class ScopeFiberViolation(fiberId: String) extends AssetModelError
  case class ScopeOperationViolation(operation: String) extends AssetModelError
  case class PolicyEvaluationFailed(reason: String) extends AssetModelError
}
```

---

## 6. Agreement Lifecycle State Machine

```
                  ┌─────────────────────────────────────┐
                  │         (not registered)             │
                  └──────────────┬──────────────────────┘
                                 │ RegisterAgreement (valid)
                                 ▼
                  ┌─────────────────────────────────────┐
                  │           ACTIVE                     │
                  │  - Producer may submit DataUpdates   │
                  │  - Either party may revoke           │
                  └──────┬──────────────────────┬───────┘
                         │ RevokeAgreement       │ current_ordinal > expires_at_ordinal
                         ▼                      ▼
              ┌───────────────────┐   ┌────────────────────┐
              │     REVOKED       │   │      EXPIRED        │
              │  - No new updates │   │  - No new updates   │
              │  - Final state    │   │  - Final state      │
              └───────────────────┘   └────────────────────┘

Notes:
  - REVOKED and EXPIRED are terminal (no transitions out)
  - Expiry is checked lazily at DataUpdate time, not eagerly by a background process
  - A new agreement with different nonce can be created even if an old one is REVOKED
```

---

## 7. SDK API Contract

### File: `src/asset-model/client.ts` (new)

These are the functions @code must implement (and test first via TDD):

```typescript
import type {
  ProducerValidatorAgreement,
  RegisterAgreementMessage,
  RevokeAgreementMessage,
  DataProof,
  AgreementIdInput,
  DataProofSignatureInput,
  RevocationSignatureInput,
} from "./types.js";
import type { Address, FiberId, FiberOrdinal, HashValue } from "../types.js";

// ─── Agreement ID computation ─────────────────────────────────────────────────

/**
 * Compute the canonical agreement_id for a set of agreement parameters.
 * Must match metagraph's computation exactly (used for verification).
 *
 * Algorithm:
 *   scopeHash = SHA3-256(JSON.stringify(scope, { sortKeys: true }))
 *   policyHash = SHA3-256(policyString)
 *   agreementId = SHA3-256(
 *     producerAddress + validatorAddress + scopeHash + policyHash + nonce.toString()
 *   )
 *
 * @returns Hex-encoded SHA3-256 hash (64 chars)
 */
export function computeAgreementId(input: AgreementIdInput): HashValue;

// ─── Signing helpers ──────────────────────────────────────────────────────────

/**
 * Compute the message that a producer must sign for a ProducerValidatorAgreement.
 *
 * @returns The agreementId itself (producers sign the agreement ID)
 */
export function agreementSignatureMessage(agreementId: HashValue): string;

/**
 * Compute the message that a producer must sign for a DataProof.
 *
 * Algorithm:
 *   payloadHash = SHA3-256(JSON.stringify(payload, { sortKeys: true }))
 *   message = SHA3-256(fiberId + eventName + payloadHash + targetSequenceNumber.toString())
 *
 * @returns Hex-encoded SHA3-256 hash
 */
export function dataProofSignatureMessage(input: DataProofSignatureInput): HashValue;

/**
 * Compute the message that a revoker must sign for RevokeAgreement.
 *
 * Algorithm:
 *   message = SHA3-256("REVOKE" + agreementId + revocationOrdinal.toString() + nonce.toString())
 *
 * @returns Hex-encoded SHA3-256 hash
 */
export function revocationSignatureMessage(input: RevocationSignatureInput): HashValue;

// ─── High-level operations ────────────────────────────────────────────────────

/**
 * Build an unsigned ProducerValidatorAgreement (ready for both parties to sign).
 * Fills in agreementId and nonce; leaves signatures empty.
 *
 * @throws {Error} if producerAddress or validatorAddress are invalid DAG addresses
 * @throws {Error} if policyJson is not valid JSON
 */
export function buildAgreement(params: {
  producerAddress: Address;
  validatorAddress: Address;
  validatorName: string;
  scope: {
    fiberIds?: FiberId[];
    namespace?: string;
    allowedOperations?: string[];
  };
  policyJson: string;
  expiresAtOrdinal?: FiberOrdinal;
}): Omit<ProducerValidatorAgreement, "producerSignature" | "validatorSignature" | "createdAtOrdinal" | "status">;

/**
 * Build a RegisterAgreement OttochainMessage payload.
 * Both signatures must be present.
 *
 * @throws {Error} if agreement.producerSignature or agreement.validatorSignature are empty
 */
export function buildRegisterAgreementMessage(
  agreement: ProducerValidatorAgreement
): RegisterAgreementMessage;

/**
 * Build a RevokeAgreement OttochainMessage payload.
 *
 * @param agreementId  - The agreement to revoke
 * @param revokerAddress - DAG address of the party revoking (producer or validator)
 * @param revokerSignature - secp256k1 signature from revoker over revocationSignatureMessage(...)
 * @param currentOrdinal - Current metagraph ordinal (exact, from /api/node/state)
 * @param nonce - Random uint64 for replay protection
 */
export function buildRevokeAgreementMessage(params: {
  agreementId: HashValue;
  revokerAddress: Address;
  revokerSignature: string;
  currentOrdinal: FiberOrdinal;
  nonce: number;
  reason?: string;
}): RevokeAgreementMessage;

/**
 * Build a DataProof for attaching to a TransitionStateMachine payload.
 * The proof goes into payload["__proof"].
 *
 * @param agreementId - Active agreement granting this producer's authority
 * @param producerAddress - Producer's DAG address
 * @param producerSignature - secp256k1 sig over dataProofSignatureMessage(...)
 * @param fiberId - Target fiber
 * @param eventName - TransitionStateMachine event name
 * @param payload - The actual event payload (without __proof key)
 * @param targetSequenceNumber - Current fiber ordinal
 */
export function buildDataProof(params: {
  agreementId: HashValue;
  producerAddress: Address;
  producerSignature: string;
  fiberId: FiberId;
  eventName: string;
  payload: unknown;
  targetSequenceNumber: number;
}): DataProof;

/**
 * Attach a DataProof to a TransitionStateMachine payload.
 * Returns a new payload object with the proof under the "__proof" key.
 *
 * Note: The proof is computed over `payload` BEFORE this attachment.
 * Do not modify payload after calling buildDataProof.
 */
export function attachDataProof(payload: Record<string, unknown>, proof: DataProof): Record<string, unknown>;

// ─── Agreement query helpers ──────────────────────────────────────────────────

/**
 * Fetch an active agreement from the bridge API by ID.
 *
 * @throws {AssetModelError} AGREEMENT_NOT_FOUND if not found
 */
export async function getAgreement(
  bridgeBaseUrl: string,
  agreementId: HashValue
): Promise<ProducerValidatorAgreement>;

/**
 * List agreements for a producer address.
 */
export async function listAgreementsByProducer(
  bridgeBaseUrl: string,
  producerAddress: Address,
  options?: { status?: AgreementStatus; limit?: number; offset?: number }
): Promise<{ agreements: ProducerValidatorAgreement[]; total: number; hasMore: boolean }>;

/**
 * List agreements for a validator address.
 */
export async function listAgreementsByValidator(
  bridgeBaseUrl: string,
  validatorAddress: Address,
  options?: { status?: AgreementStatus; limit?: number; offset?: number }
): Promise<{ agreements: ProducerValidatorAgreement[]; total: number; hasMore: boolean }>;
```

---

## 8. Bridge REST Endpoints

The bridge (`ottochain-services`) must expose these endpoints to serve agreement state (stored in the indexer after ML0 acceptance).

### `GET /api/agreements/:agreementId`

Returns a single agreement.

**Response 200:**
```json
{
  "agreementId": "abc123...",
  "producer": { "address": "DAGxxx", "metadata": {} },
  "validator": { "address": "DAGyyy", "name": "SportsLeague" },
  "scope": { "fiberIds": [], "allowedOperations": ["score_update"] },
  "createdAtOrdinal": 4201,
  "expiresAtOrdinal": 0,
  "policy": "{\"and\": [{\"<\": [{\"var\": \"score\"}, 200]}]}",
  "producerSignature": "hex...",
  "validatorSignature": "hex...",
  "nonce": 1,
  "status": "ACTIVE"
}
```

**Response 404:** `{ "error": "AGREEMENT_NOT_FOUND", "agreementId": "abc123..." }`

### `GET /api/agreements?producer=DAGxxx&status=ACTIVE&limit=20&offset=0`

**Query params:** `producer` (optional), `validator` (optional), `status` (optional: `ACTIVE|EXPIRED|REVOKED`), `limit` (default 20, max 100), `offset` (default 0)

**Response 200:**
```json
{
  "agreements": [...],
  "total": 42,
  "hasMore": true
}
```

### `GET /api/agreements/:agreementId/proofs`

Returns `ValidationProof` records for a given agreement (most recent first).

**Response 200:**
```json
{
  "proofs": [
    {
      "dataUpdateHash": "hex...",
      "agreementId": "abc123...",
      "validatedAtOrdinal": 4210,
      "policyPassed": true,
      "ml0NodeAddress": "DAGzzz"
    }
  ],
  "total": 88,
  "hasMore": true
}
```

---

## 9. Test Scenarios

These are the **required test cases** for @code to implement as failing tests before any implementation. Organized by component.

### 9.1 `computeAgreementId` (unit tests)

```
✅ produces deterministic output for same inputs
✅ changes when producerAddress changes
✅ changes when validatorAddress changes
✅ changes when nonce changes
✅ changes when scope changes (key order in JSON irrelevant — must normalize)
✅ changes when policy changes
✅ output is 64-char hex string
```

### 9.2 `dataProofSignatureMessage` (unit tests)

```
✅ deterministic for same inputs
✅ changes when fiberId changes
✅ changes when eventName changes
✅ changes when payload changes (normalizes key order)
✅ changes when targetSequenceNumber changes
✅ output is 64-char hex string
```

### 9.3 `revocationSignatureMessage` (unit tests)

```
✅ deterministic for same inputs
✅ changes when agreementId changes
✅ changes when revocationOrdinal changes
✅ changes when nonce changes
✅ prefix "REVOKE" is included (different from agreement signing)
```

### 9.4 `buildAgreement` (unit tests)

```
✅ fills in nonce (non-zero)
✅ computes agreementId matching computeAgreementId()
✅ throws on invalid producer DAG address
✅ throws on invalid validator DAG address
✅ throws on invalid policyJson (non-JSON string)
✅ returns object without producerSignature/validatorSignature keys
✅ scope.fiberIds defaults to empty array if not provided
✅ scope.allowedOperations defaults to empty array if not provided
```

### 9.5 `buildRegisterAgreementMessage` (unit tests)

```
✅ returns RegisterAgreementMessage wrapping the agreement
✅ throws if producerSignature is empty
✅ throws if validatorSignature is empty
```

### 9.6 `buildDataProof` + `attachDataProof` (unit tests)

```
✅ proof.agreementId matches input
✅ proof.producerAddress matches input
✅ proof.producerSignature matches input
✅ attachDataProof adds "__proof" key to payload
✅ attachDataProof does not mutate original payload
✅ attachDataProof result has all original payload keys
✅ proof is computed over payload WITHOUT __proof key (if rebuilding from raw)
```

### 9.7 ML0 RegisterAgreement validation (integration tests — metagraph)

```
✅ valid RegisterAgreement → agreement stored with status ACTIVE
✅ valid RegisterAgreement → created_at_ordinal set to current ordinal
✅ duplicate agreement_id → rejected AGREEMENT_ALREADY_EXISTS
✅ agreement_id mismatch (tampered) → rejected AGREEMENT_ID_MISMATCH
✅ invalid producer signature → rejected INVALID_PRODUCER_SIGNATURE
✅ invalid validator signature → rejected INVALID_VALIDATOR_SIGNATURE
✅ expired at past ordinal → rejected AGREEMENT_ALREADY_EXPIRED
✅ invalid policy JSON → rejected INVALID_POLICY_JSON
✅ invalid producer DAG address → rejected INVALID_PRODUCER_ADDRESS
✅ invalid validator DAG address → rejected INVALID_VALIDATOR_ADDRESS
```

### 9.8 ML0 RevokeAgreement validation (integration tests — metagraph)

```
✅ valid revocation by producer → agreement status REVOKED
✅ valid revocation by validator → agreement status REVOKED
✅ non-existent agreement_id → rejected AGREEMENT_NOT_FOUND
✅ already-revoked agreement → rejected AGREEMENT_NOT_ACTIVE
✅ expired agreement → rejected AGREEMENT_NOT_ACTIVE
✅ third-party revoker (neither producer nor validator) → rejected UNAUTHORIZED_REVOKER
✅ wrong ordinal → rejected INVALID_REVOCATION_ORDINAL
✅ invalid signature → rejected INVALID_REVOKER_SIGNATURE
✅ nonce reuse within same ordinal → rejected NONCE_ALREADY_USED
```

### 9.9 ML0 TransitionStateMachine with DataProof (integration tests — metagraph)

```
✅ valid transition with valid DataProof → accepted, ValidationProof emitted
✅ asset-model fiber without DataProof → rejected PROOF_REQUIRED
✅ DataProof referencing non-existent agreement → rejected AGREEMENT_NOT_FOUND
✅ DataProof with revoked agreement → rejected AGREEMENT_NOT_ACTIVE
✅ DataProof with expired agreement (ordinal check) → rejected AGREEMENT_EXPIRED
✅ DataProof producer != agreement producer → rejected PRODUCER_MISMATCH
✅ event_name not in scope.allowed_operations → rejected SCOPE_OPERATION_VIOLATION
✅ fiber_id not in scope.fiber_ids → rejected SCOPE_FIBER_VIOLATION
✅ invalid producer signature → rejected INVALID_PRODUCER_SIGNATURE
✅ policy evaluation fails (JLVM returns false) → rejected POLICY_EVALUATION_FAILED
✅ policy is always-true → accepts all otherwise-valid DataUpdates
✅ ValidationProof stored in onChainState after successful update
```

### 9.10 Bridge REST endpoints (integration tests — bridge)

```
✅ GET /api/agreements/:id — returns agreement for registered agreement
✅ GET /api/agreements/:id — 404 for unknown agreement
✅ GET /api/agreements?producer=DAGxxx — filters by producer
✅ GET /api/agreements?validator=DAGyyy — filters by validator
✅ GET /api/agreements?status=ACTIVE — filters by status
✅ GET /api/agreements?status=REVOKED — returns revoked agreements
✅ GET /api/agreements — pagination: limit and offset work
✅ GET /api/agreements/:id/proofs — returns validation proofs (most recent first)
✅ GET /api/agreements/:id/proofs — empty list for newly registered agreement
```

---

## Appendix: Signature Scheme Reference

All signatures in this spec use **secp256k1** (same as Constellation/OttoChain standard).

| What | Signed by | Message |
|------|-----------|---------|
| Agreement (producer) | Producer private key | `agreementId` (hex) |
| Agreement (validator) | Validator private key | `agreementId` (hex) |
| DataProof | Producer private key | `SHA3-256(fiberId \|\| eventName \|\| payloadHash \|\| seqNum)` |
| RevokeAgreement | Producer OR Validator private key | `SHA3-256("REVOKE" \|\| agreementId \|\| ordinal \|\| nonce)` |

**Hash function:** SHA3-256 throughout (not keccak256; not SHA2-256).  
**Encoding:** All hashes are hex-encoded lowercase strings.  
**String concatenation:** Plain string concat (no delimiters between fields). Length-prefix concerns are out of scope for v1.

---

*Spec by @think. Implementation: @work (Scala metagraph) + @code (TypeScript SDK + tests). Questions → Trello card comments.*
