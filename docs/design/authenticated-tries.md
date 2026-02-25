# 5-Type Authenticated Trie System: Design Specification

**Version**: 1.0  
**Date**: 2026-02-25  
**Status**: Specification  
**Deliverable**: Architecture specification for `src/apps/asset_model/tries/`  
**Scope**: Application layer (ottochain-sdk, Producer-Validator framework)  
**Epic**: Asset Model Exploration (6988fbbc868813f6c635ca64)  
**Card**: 🌲 Spec: 5-type authenticated trie data structure design (6996301951e7714cb2d50700)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Context and Motivation](#context-and-motivation)
3. [The 5 Trie Dimensions](#the-5-trie-dimensions)
4. [Metakit MPT API](#metakit-mpt-api)
5. [Path Encoding Scheme](#path-encoding-scheme)
6. [Combined Root Commitment Strategy](#combined-root-commitment-strategy)
7. [Proof Generation Per Dimension](#proof-generation-per-dimension)
8. [Efficient Batch Update Patterns](#efficient-batch-update-patterns)
9. [Trade-offs: 5-Trie vs Single Trie](#trade-offs-5-trie-vs-single-trie)
10. [Memory and Storage Estimates](#memory-and-storage-estimates)
11. [Integration with Fiber stateRoot](#integration-with-fiber-stateroot)
12. [TypeScript Interface Design](#typescript-interface-design)
13. [TDD Test Plan](#tdd-test-plan)
14. [Open Questions](#open-questions)

---

## Executive Summary

The Asset Model Producer-Validator framework stores rich multi-dimensional state in each fiber's `stateData`. A single flat Merkle Patricia Trie over all state keys would work but is suboptimal: cross-domain queries require traversing interleaved keys, proof composition is awkward, and domain-specific indexing is impossible.

**This spec defines a 5-type authenticated trie architecture** where each dimension has its own `MerklePatriciaTrie` rooted in a sub-tree of the fiber's state, with all 5 roots combined into a single `stateRoot` committed on-chain via `StateMachineFiberRecord.stateRoot` (PR #107).

**Feasibility**: HIGH — Metakit's `MerklePatriciaProducer` API (`inMemory`, `levelDb`, `stateless`) fully supports this design with zero new cryptographic dependencies. The 5-type split is proven in production (Ethereum account state, Diem JMT column families, Aptos state tree namespacing). See prior research: `memory/2026-02-14-authenticated-tries-multi-dimensional-research.md`.

**Key constraint**: This is an **application-layer** design. The 5 tries live within a fiber's `stateData` namespace — they are NOT separate metagraph-level tries (clarification from metagraph integration analysis, PR #107).

---

## Context and Motivation

### Where This Fits

```
Constellation L0 (Global Snapshot)
  └─ CurrencyIncrementalSnapshot.calculatedStateHash  ← metagraphStateRoot (PR #107)
       └─ MPT of { fiberId → fiberStateRoot }
            └─ fiberStateRoot = combined root of 5 tries  ← THIS SPEC
                 ├─ Permissions Trie root
                 ├─ Relationships Trie root
                 ├─ Activities Trie root
                 ├─ Assets Trie root
                 └─ Group Trie root
```

### Why 5 Tries?

The Producer-Validator framework (see `docs/design/producer-validator-framework.md`) manages 5 structurally distinct data domains:

| Domain | Access Pattern | Key Observation |
|--------|---------------|-----------------|
| **Permissions** | Auth chain traversal | Hierarchical, revocation-heavy |
| **Relationships** | Set membership | Group/agreement scoped |
| **Activities** | Sequential range scan | Ordinal-ordered event log |
| **Assets** | Point lookup + aggregate | Balance-centric, fungible |
| **Group** | Shared policy read | Rarely modified, widely read |

A flat single trie interleaves all 5 patterns into one key space, degrading:
- **Query performance**: O(log²n) for domain queries vs O(log n) with domain prefix isolation
- **Proof size**: Proofs traverse unrelated intermediate nodes
- **Batch update efficiency**: All 5 domains require a single serialized writer

The 5-trie design provides logical isolation with a single combined root — best of both worlds.

---

## The 5 Trie Dimensions

### 1. Permissions Trie

**Purpose**: Delegation credentials, access rights, authority chains.

**Key path structure**:
```
permissions:delegations/{direction}/{participant}/{permission}
  direction = "issued" | "received"
  participant = DAG address (hex)
  permission = operation code (e.g., "transfer", "admin")

permissions:authorities/{participant}/{scopeHash}
  scopeHash = SHA-256(serialized scope constraints)
```

**Value types**: `DelegationCredential` (serialized as JSON)

**Access patterns**:
- "Does Alice have transfer permission?" → exact lookup by path
- "What did Alice delegate to Bob?" → prefix scan `permissions:delegations/issued/alice/`
- "Is delegation X still valid?" → revoke check by credential ID

**Why separate**: Delegation tree traversal requires repeated parent lookups — a dedicated trie lets us cache hot paths (authority chains) without polluting asset state.

### 2. Relationships Trie

**Purpose**: Group memberships, agreement hierarchies, role assignments.

**Key path structure**:
```
relationships:groups/{groupId}/members/{participantId}
relationships:groups/{groupId}/agreements/{agreementId}
relationships:agreements/{agreementId}/producer
relationships:agreements/{agreementId}/validator
relationships:agreements/{agreementId}/status
```

**Value types**: `AgreementStatus`, `ParticipantRef`, `GroupMembership`

**Access patterns**:
- "Is participant X a member of group G?" → point lookup
- "What agreements belong to group G?" → prefix scan
- "What is the current status of agreement A?" → point lookup

**Why separate**: Membership sets change infrequently but are queried for almost every event validation. Isolated trie enables efficient caching and proof generation for membership verification without traversing event history.

### 3. Activities Trie

**Purpose**: Ordered event log, audit trail, transition history.

**Key path structure**:
```
activities:events/{groupId}/{seriesId}/{ordinal}
  ordinal = zero-padded 16-digit hex (enables lexicographic range scans)

activities:receipts/{fiberId}/{eventHash}
```

**Value types**: `EventReceipt`, `TransitionResult`

**Access patterns**:
- "Get the last N events for series S" → reverse range scan with prefix `activities:events/{groupId}/{seriesId}/`
- "Was event E processed?" → exact lookup by eventHash
- "Get events between ordinals A and B" → range query

**Why separate**: The activities trie is append-only and grows ~1 entry per transition. Range queries over ordinal-keyed leaves are critically efficient here. The zero-padded ordinal key enables lexicographic scanning without sorting.

**Key design decision**: Ordinal encoding uses big-endian unsigned 64-bit hex (16 chars):
```typescript
function encodeOrdinal(ordinal: bigint): string {
  return ordinal.toString(16).padStart(16, '0');
}
// ordinal 0       → "0000000000000000"
// ordinal 255     → "00000000000000ff"
// ordinal 2^64-1  → "ffffffffffffffff"
```

### 4. Assets Trie

**Purpose**: Token ownership, balances, locked amounts, asset states.

**Key path structure**:
```
assets:tokens/{groupId}/{seriesId}/{tokenId}/owner
assets:tokens/{groupId}/{seriesId}/{tokenId}/state
assets:balances/{groupId}/{seriesId}/{participantId}/total
assets:balances/{groupId}/{seriesId}/{participantId}/locked
assets:locks/{lockId}/amount
assets:locks/{lockId}/unlockAt
```

**Value types**: `TokenState`, `Balance`, `LockRecord`

**Access patterns**:
- "What is Alice's balance in series S?" → point lookup
- "What tokens does Alice own?" → prefix scan `assets:tokens/{groupId}/{seriesId}/` with owner filter
- "Is token T locked?" → lookup `assets:locks/{lockId}`

**Why separate**: Asset reads are the most frequent operation (every transfer validation). Isolated trie maximizes cache hit rate on the hot balance paths.

### 5. Group Trie

**Purpose**: Shared group-level state — policies, aggregate statistics, governance config.

**Key path structure**:
```
group:policies/{policyId}/guard
group:policies/{policyId}/effects
group:stats/totalEvents
group:stats/totalTokens
group:stats/totalTransfers
group:governance/threshold
group:governance/votingPeriod
```

**Value types**: `PolicyConfig`, `AggregateStats`, `GovernanceConfig`

**Access patterns**:
- "What is the current transfer limit policy?" → point lookup
- "What are the current aggregate stats?" → prefix scan `group:stats/`
- "What governance parameters are active?" → prefix scan `group:governance/`

**Why separate**: Group state is read by every participant on every event but modified only during governance transitions. Isolated trie with stable root enables proof caching across consensus rounds.

---

## Metakit MPT API

OttoChain uses metakit's `MerklePatriciaProducer` API. The relevant Scala types:

```scala
// Stateless: ephemeral per-call, no internal state
MerklePatriciaProducer.stateless[F]
  .create[A: Encoder](data: Map[Hex, A]): F[MerklePatriciaTrie]

// Stateful in-memory: maintains mutable state across calls
MerklePatriciaProducer.inMemory[F](initial: Map[Hex, Json] = Map.empty)
  : F[StatefulMerklePatriciaProducer[F]]

// StatefulMerklePatriciaProducer methods:
//   insert[A](data: Map[Hex, A]): F[Either[Error, Unit]]
//   update[A](key: Hex, value: A): F[Either[Error, Unit]]
//   remove(keys: List[Hex]): F[Either[Error, Unit]]
//   build: F[Either[Error, MerklePatriciaTrie]]
//   entries: F[Map[Hex, Json]]
//   getProver: F[MerklePatriciaProver[F]]

// Proof generation:
prover.attestPath(path: Hex): F[Either[ProofError, MerklePatriciaInclusionProof]]

// Proof verification (stateless):
MerklePatriciaVerifier.make[F](root: Hash).confirm(proof): F[Either[VerifError, Unit]]
```

### Design Choice: One InMemory Producer Per Trie

Each of the 5 trie types maintains its own `StatefulMerklePatriciaProducer[F]`:

```scala
case class FiberAuthenticatedTries[F[_]](
  permissions : StatefulMerklePatriciaProducer[F],
  relationships: StatefulMerklePatriciaProducer[F],
  activities  : StatefulMerklePatriciaProducer[F],
  assets      : StatefulMerklePatriciaProducer[F],
  group       : StatefulMerklePatriciaProducer[F]
)
```

This matches how metakit's LevelDB producer uses separate column families per trie. In-memory producers are sufficient for a single fiber's stateData; LevelDB is appropriate if per-fiber trie state must persist across node restarts independently.

---

## Path Encoding Scheme

### Key Format

All paths are encoded as `Hex` values (hexadecimal string, lowercase, no `0x` prefix) per metakit's `io.constellationnetwork.security.hex.Hex` type:

```scala
import io.constellationnetwork.security.hex.Hex
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

def encodePath(logicalPath: String): Hex = {
  // SHA-256 of the UTF-8 path string, hex-encoded
  val digest = MessageDigest.getInstance("SHA-256")
  val bytes = digest.digest(logicalPath.getBytes(StandardCharsets.UTF_8))
  Hex(bytes.map("%02x".format(_)).mkString)
}
```

**Why SHA-256?**: Provides uniform key distribution regardless of path structure, preventing trie degeneration from common-prefix keys (e.g., all `assets:balances/DAG123.../` prefixed keys would otherwise share a very long common extension in the MPT).

**Trade-off**: Loses lexicographic ordering for range queries. The Activities trie requires range scans, so it uses a **hybrid encoding**: the ordinal prefix is kept as a zero-padded hex string (for sorting), and only the opaque portion is SHA-256:

```scala
// Activities path: preserves ordinal ordering within a series prefix
def encodeActivityPath(groupId: String, seriesId: String, ordinal: Long): Hex = {
  val ordinalHex = "%016x".format(ordinal)  // fixed-width, lexicographically sortable
  val prefix = s"activities:events:${sha256(groupId)}:${sha256(seriesId)}:"
  // Prefix SHA-256'd, ordinal appended as-is for range scan support
  Hex(sha256(prefix) + ordinalHex)
}
```

This is the only trie requiring range-friendly encoding. All others use full SHA-256.

### Namespace Separation

Each trie has its own producer, so key collisions between trie types are impossible. The logical path namespace prefix (`permissions:`, `relationships:`, etc.) is used for documentation clarity only — the encoded key is always 32 bytes (64 hex chars).

---

## Combined Root Commitment Strategy

### Goal

Produce a single `stateRoot: Hash` for a fiber that commits all 5 trie roots cryptographically. This `stateRoot` is stored in `StateMachineFiberRecord.stateRoot` and aggregated into the metagraph-level `metagraphStateRoot` (per PR #107 design).

### Two-Level MPT Strategy

```
stateRoot
  └─ MPT leaf "00" → permissions root hash
  └─ MPT leaf "01" → relationships root hash
  └─ MPT leaf "02" → activities root hash
  └─ MPT leaf "03" → assets root hash
  └─ MPT leaf "04" → group root hash
```

The combined root is itself an MPT with 5 fixed-position leaves (keys `00`–`04`):

```scala
object TrieIndex {
  val Permissions  : Hex = Hex("00")
  val Relationships: Hex = Hex("01")
  val Activities   : Hex = Hex("02")
  val Assets       : Hex = Hex("03")
  val Group        : Hex = Hex("04")
}

def computeCombinedRoot[F[_]: JsonBinaryHasher: MonadThrow](
  roots: FiberTrieRoots
): F[Hash] =
  MerklePatriciaTrie.make[F, Hash](Map(
    TrieIndex.Permissions   -> roots.permissions,
    TrieIndex.Relationships -> roots.relationships,
    TrieIndex.Activities    -> roots.activities,
    TrieIndex.Assets        -> roots.assets,
    TrieIndex.Group         -> roots.group
  )).map(_.rootNode.digest)

case class FiberTrieRoots(
  permissions  : Hash,
  relationships: Hash,
  activities   : Hash,
  assets       : Hash,
  group        : Hash
)
```

### Why Not 5 Separate Fields in stateData?

A flat JSON object `{ "permissionsRoot": "...", ... }` would not be cryptographically committed independently — any field could be selectively omitted or altered. The two-level MPT ensures that a proof of `stateRoot` implies commitment to all 5 trie roots.

### Empty Trie Handling

An empty trie (no entries) must still produce a deterministic root hash. Metakit's stateless producer will fail on an empty map — handle this by inserting a sentinel entry:

```scala
// If trie has no real entries, use a deterministic empty marker
val EmptySentinelKey: Hex = Hex("00" * 32)
val EmptySentinelValue: Json = Json.Null

def buildOrEmpty[F[_]: JsonBinaryHasher: MonadThrow](
  producer: StatefulMerklePatriciaProducer[F]
): F[Hash] =
  producer.entries.flatMap { entries =>
    if (entries.isEmpty)
      // Build a 1-entry "empty" trie deterministically
      MerklePatriciaProducer.stateless[F]
        .create[Json](Map(EmptySentinelKey -> Json.Null))
        .map(_.rootNode.digest)
    else
      producer.build.flatMap {
        case Right(trie) => trie.rootNode.digest.pure[F]
        case Left(e)     => MonadThrow[F].raiseError(e)
      }
  }
```

---

## Proof Generation Per Dimension

### Single-Dimension Proof

To prove a specific value at a path within one trie:

```scala
// Example: prove Alice has transfer permission
val path = encodePath("permissions:delegations/issued/DAGalice.../transfer")

for {
  prover <- tries.permissions.getProver
  proof  <- prover.attestPath(path).flatMap(MonadThrow[F].fromEither)
} yield PermissionProof(path = path, witness = proof.witness)
```

Verification (by a third party holding only the root):
```scala
MerklePatriciaVerifier.make[F](knownPermissionsRoot).confirm(proof)
```

### Cross-Trie Proof Composition

To prove a value AND prove which trie it came from (relative to `stateRoot`):

```scala
case class AuthenticatedFieldProof(
  stateRoot    : Hash,           // top-level fiber root
  trieKey      : Hex,            // TrieIndex.Permissions etc.
  trieRootProof: MerklePatriciaInclusionProof,  // stateRoot → trie root
  fieldProof   : MerklePatriciaInclusionProof   // trie root → leaf value
)
```

Verification requires two rounds:
1. Confirm `fieldProof` against the claimed trie root
2. Confirm `trieRootProof` against `stateRoot` to establish the claimed trie root

```scala
def verifyAuthenticatedField[F[_]: Async: JsonBinaryHasher](
  p: AuthenticatedFieldProof
): F[Boolean] =
  for {
    trieRootHash <- p.trieRootProof.witness.lastOption match {
      case Some(MerklePatriciaCommitment.Leaf(_, dataDigest)) => dataDigest.pure[F]
      case _ => MonadThrow[F].raiseError(new Exception("Malformed proof"))
    }
    // 1. Verify field belongs to trie
    fieldOk <- MerklePatriciaVerifier.make[F](trieRootHash).confirm(p.fieldProof).map(_.isRight)
    // 2. Verify trie root belongs to stateRoot
    trieOk  <- MerklePatriciaVerifier.make[F](p.stateRoot).confirm(p.trieRootProof).map(_.isRight)
  } yield fieldOk && trieOk
```

---

## Efficient Batch Update Patterns

### The Problem

A single fiber event may update multiple trie dimensions simultaneously:

- `transfer` event → update Assets (balances) + Activities (event log)
- `delegate` event → update Permissions (new credential) + Relationships (agreement update)
- `govern` event → update Group (policy change) + Activities (event log)

### Proposed: Parallel Producer Updates

Since each trie has its own independent producer, updates can be applied in parallel:

```scala
def applyFiberEvent(
  tries : FiberAuthenticatedTries[F],
  event : FiberEvent,
  changes: TrieChanges   // computed by the FiberEngine
)(implicit F: Concurrent[F]): F[Unit] = {

  // Apply changes to each trie in parallel
  List(
    changes.permissions.map(c => tries.permissions.insert(c.inserts) >> tries.permissions.remove(c.removes)),
    changes.relationships.map(c => tries.relationships.insert(c.inserts) >> tries.relationships.remove(c.removes)),
    changes.activities.map(c => tries.activities.insert(c.inserts)),  // append-only
    changes.assets.map(c => tries.assets.insert(c.inserts) >> tries.assets.remove(c.removes)),
    changes.group.map(c => tries.group.insert(c.inserts) >> tries.group.remove(c.removes)),
  ).flatten.parTraverse_(identity)
}

case class TrieChangeSet(
  inserts: Map[Hex, Json] = Map.empty,
  removes: List[Hex]     = Nil
)

case class TrieChanges(
  permissions  : Option[TrieChangeSet],
  relationships: Option[TrieChangeSet],
  activities   : Option[TrieChangeSet],
  assets       : Option[TrieChangeSet],
  group        : Option[TrieChangeSet]
)
```

### Snapshot Commitment

After all updates are applied, build all 5 tries and compute the combined root:

```scala
def commitTrieState[F[_]: Concurrent: JsonBinaryHasher: MonadThrow](
  tries: FiberAuthenticatedTries[F]
): F[Hash] = {

  // Build all 5 tries in parallel
  val buildAll = (
    buildOrEmpty(tries.permissions),
    buildOrEmpty(tries.relationships),
    buildOrEmpty(tries.activities),
    buildOrEmpty(tries.assets),
    buildOrEmpty(tries.group)
  ).parMapN(FiberTrieRoots.apply)

  buildAll.flatMap(computeCombinedRoot[F])
}
```

**Atomicity**: In the OttoChain metagraph, `commitTrieState` is called inside the `FiberCombiner.combine()` call, which runs within a single `Ref[F, DataState]` update. This provides atomicity at the application level — no partial trie state is ever visible.

---

## Trade-offs: 5-Trie vs Single Trie

### Single Unified Trie

```
Pros:
  ✓ Simpler implementation (one producer)
  ✓ Atomic updates without coordination
  ✓ No cross-trie proof composition overhead
  ✓ Range queries work trivially (ordinal-sorted keys)
  
Cons:
  ✗ Proof size grows with total state size (all domains interleaved)
  ✗ Cannot cache domain-specific subtrees
  ✗ Cannot parallelize updates across domains
  ✗ Range scan for Activities requires filtering non-activity keys
  ✗ Domain-specific proof generation requires knowing unrelated key structure
```

### 5-Trie Architecture

```
Pros:
  ✓ O(log n_d) proofs scoped to domain d (vs O(log n_total))
  ✓ Domain-specific optimizations (e.g., ordinal encoding for Activities)
  ✓ Parallel updates across domains (Concurrent[F])
  ✓ Proof for "Alice has permission X" doesn't reveal token balances
  ✓ Cache isolation: hot asset paths don't pollute permission cache
  ✓ Clean producer lifecycle per domain
  
Cons:
  ✗ Combined root requires second-level MPT (2 proof steps for authenticated field)
  ✗ 5x producers to manage per fiber
  ✗ Cross-trie queries require proof composition
  ✗ Implementation complexity higher (5 path encoders, 1 combiner)
```

**Recommendation**: 5-trie for the asset model because:
1. Privacy isolation between permissions and asset state is a first-class requirement
2. Activities trie ordinal encoding is incompatible with flat interleaving
3. The asset model is designed for cross-metagraph proofs — smaller proofs are critical for on-chain inclusion in JSON Logic guards

---

## Memory and Storage Estimates

### Per-Fiber Estimates (In-Memory)

Assumptions:
- Average path length after SHA-256: 32 bytes (64 hex chars)
- Average leaf value: 128 bytes (JSON-encoded credential / balance)
- MPT node overhead: ~64 bytes per node (branch with 16 children slots)

| Trie | Max Entries | Est. Nodes | Memory |
|------|------------|-----------|--------|
| Permissions | 100 delegations | ~200 | ~20 KB |
| Relationships | 50 memberships | ~100 | ~10 KB |
| Activities | 10,000 events | ~20,000 | ~2 MB |
| Assets | 500 tokens/balances | ~1,000 | ~100 KB |
| Group | 50 policy entries | ~100 | ~10 KB |
| **Combined root** | 5 leaves | ~10 | ~1 KB |
| **Total** | | | **~2.1 MB per fiber** |

**Dominant cost**: Activities trie. Every state transition appends an event. For a fiber with 10,000 events (realistic long-lived market or contract), the activities trie alone is ~2 MB.

### Implications

1. **In-memory per-fiber**: Acceptable for metagraph operation (each ML0 node holds all fiber state in CalculatedState). With 100 active fibers, total trie memory = ~210 MB — within the observed 3 GB ML0 footprint.

2. **LevelDB backend**: Required for fibers with >100,000 events (>20 MB activities trie). `MerklePatriciaProducer.levelDb` provides transparent swap with the same API.

3. **Proof size**: O(log n) commitments at ~64 bytes each. For 10,000 events: log₁₆(10,000) ≈ 3.5 → 4 commitments → ~256 bytes. Cross-trie proof: add 2 more for combined root → ~384 bytes total. Acceptable for JSON Logic guard inclusion.

4. **Snapshotting**: The trie state is reconstructed from `CalculatedState.stateData` on each snapshot (since `stateData` contains the current values, not the trie nodes). The trie is always rebuilt from scratch per snapshot round — LevelDB persistence is an optimization, not a correctness requirement.

---

## Integration with Fiber stateRoot

This spec produces the `stateRoot: Hash` field required by PR #107's metagraph integration analysis.

### Where It's Computed

In `FiberCombiner.combine()`, after processing a `TransitionStateMachine` update:

```scala
// After applying the transition and updating stateData:
stateRoot <- commitTrieState(fiber.cid, newStateData, tries)
updatedFiber = fiber.copy(
  currentState = transition.to,
  stateData    = newStateData,
  stateRoot    = stateRoot    // ← produced by this spec
)
```

### What Goes in stateData vs Tries

**Rule**: `stateData` contains the **current authoritative values** (JSON Logic variables accessible in guards/effects). The tries provide **cryptographic commitments** to those values, enabling external proofs.

```
stateData (JSON):
  {
    "balance": 1000,        ← used in JsonLogic guards
    "permissions": [...],   ← queried via {var: "state.permissions"}
    "events": [...]         ← recent events cache
  }

Trie system:
  Assets trie:       balance → 1000          ← commitment for external proofs
  Permissions trie:  alice→transfer → true   ← commitment for cross-metagraph proofs
  Activities trie:   ordinal 42 → EventReceipt ← audit trail commitment
```

The `stateRoot` commits ALL of `stateData`'s meaningful state. It's computed from the tries, not from JSON hashing, to enable efficient partial proofs.

---

## TypeScript Interface Design

For the ottochain-sdk (TypeScript layer), the authenticated tries are exposed as:

```typescript
// src/apps/asset_model/tries/types.ts

export enum TrieDimension {
  Permissions   = 'permissions',
  Relationships = 'relationships',
  Activities    = 'activities',
  Assets        = 'assets',
  Group         = 'group'
}

export interface TrieProof {
  path: string;         // Logical path (human-readable)
  pathHex: string;      // SHA-256 encoded key
  witness: Commitment[]; // Metakit MerklePatriciaInclusionProof
  trieRoot: string;     // Root hash of the containing trie
}

export interface AuthenticatedFieldProof {
  stateRoot: string;          // Top-level fiber stateRoot
  dimension: TrieDimension;
  trieRootProof: TrieProof;   // Proves trie root → stateRoot
  fieldProof: TrieProof;      // Proves value → trie root
  value: unknown;             // The claimed field value
}

export interface FiberTrieState {
  stateRoot: string;
  trieRoots: Record<TrieDimension, string>;
  // Proof generation
  proveField(dim: TrieDimension, logicalPath: string): Promise<AuthenticatedFieldProof>;
  // Batch update
  applyChanges(changes: Partial<Record<TrieDimension, TrieChangeSet>>): Promise<void>;
  // Commit to produce new stateRoot
  commit(): Promise<string>;
}

export interface TrieChangeSet {
  inserts: Map<string, unknown>;  // logicalPath → value
  removes: string[];              // logicalPaths to delete
}
```

### SDK Factory

```typescript
// src/apps/asset_model/tries/index.ts

export function createFiberTrieState(
  initialStateData?: Record<string, unknown>
): FiberTrieState {
  // Initializes 5 in-memory tries from stateData
  // Returns FiberTrieState with proveField/applyChanges/commit
}

export function verifyAuthenticatedFieldProof(
  proof: AuthenticatedFieldProof
): boolean {
  // Stateless verification of a cross-trie proof
  // Uses MerklePatriciaVerifier logic (pure, no I/O)
}
```

---

## TDD Test Plan

### Group 1: Individual Trie Operations (6 tests)

| Test | Description |
|------|-------------|
| T1.1 | `Permissions trie insert + attestPath` returns valid inclusion proof |
| T1.2 | `Activities trie ordinal encoding` produces lexicographic range order |
| T1.3 | `Assets trie balance update + proof` roundtrip |
| T1.4 | `Empty trie buildOrEmpty` produces deterministic sentinel hash |
| T1.5 | `Relationships trie remove + proof` fails for removed key |
| T1.6 | `Group trie policy insert + verify` with MerklePatriciaVerifier |

### Group 2: Combined Root Commitment (4 tests)

| Test | Description |
|------|-------------|
| T2.1 | `computeCombinedRoot` changes when any single trie root changes |
| T2.2 | `computeCombinedRoot` is deterministic for same inputs |
| T2.3 | `stateRoot` proof includes 2-level witness (field → trie root → stateRoot) |
| T2.4 | `verifyAuthenticatedField` succeeds for valid proof, fails for tampered value |

### Group 3: Batch Update Patterns (4 tests)

| Test | Description |
|------|-------------|
| T3.1 | Parallel update (assets + activities) produces correct combined root |
| T3.2 | Events-only update leaves Permissions/Assets/Relationships/Group roots unchanged |
| T3.3 | `commitTrieState` called twice with same changes is idempotent |
| T3.4 | Transfer event changes Assets AND Activities (but not Permissions/Relationships/Group) |

### Group 4: stateRoot Integration (3 tests)

| Test | Description |
|------|-------------|
| T4.1 | `StateMachineFiberRecord.stateRoot` changes after any fiber transition |
| T4.2 | Reconstructed trie from `stateData` produces same roots as original build |
| T4.3 | Cross-fiber proof: trie root for fiber F can be verified against `metagraphStateRoot` (via PR #107 MPT chain) |

### Group 5: Privacy and Isolation (2 tests)

| Test | Description |
|------|-------------|
| T5.1 | Permissions proof does NOT reveal any Assets trie keys |
| T5.2 | Activities range scan for series S does NOT return entries for series S' |

**Total: 19 TDD test cases**

---

## Open Questions

| ID | Question | Impact | Owner |
|----|----------|--------|-------|
| OQ-1 | Should the Activities trie use a separate LevelDB backend for production to avoid per-round rebuild cost? | Performance (affects large fibers) | @work |
| OQ-2 | Is `stateData` the canonical source of truth, or are the tries? If a validator node crashes mid-update, how is consistency ensured? | Correctness | James |
| OQ-3 | The cross-trie proof requires 2 MPT confirmation calls. Is this acceptable latency for JSON Logic guard evaluation in `FiberEngine`? | Performance | @work |
| OQ-4 | Should the combined root use a flat 5-leaf MPT (as specified here) or a JSON hash of the 5 roots? The MPT approach enables proof of "which tries changed" but adds complexity. | Design | James |
| OQ-5 | Token behavior matrix (16 types): should type-specific state go in the Assets trie or in `stateData` directly? | Scope | @think |

---

*Specification by @research (OttoResearch) — 2026-02-25*  
*Prior art: `memory/2026-02-14-authenticated-tries-multi-dimensional-research.md`, Done card 6988fb76 (general research), metagraph integration analysis PR #107*  
*Feasibility: HIGH — Metakit MPT fully implements required primitives; no new dependencies*
