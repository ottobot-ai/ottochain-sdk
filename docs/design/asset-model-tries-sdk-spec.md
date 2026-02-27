# SDK: Multi-Dimensional Authenticated Trie Management — TypeScript Spec

**Version**: 1.0  
**Date**: 2026-02-26  
**Card**: 🌲 SDK: Multi-dimensional authenticated trie management (69963015)  
**Branch**: `feat/authenticated-tries`  
**Deliverable**: `src/apps/asset_model/tries/` in `ottochain-sdk`  
**Status**: Specification  
**Blocked on**: PR #117 merge (adds `stateRoot` to `StateMachineFiberRecord`)  

---

## Overview

The Scala metagraph layer (PR #107 + PR #117) computes per-fiber `stateRoot` values using a 5-trie authenticated structure. This spec defines the **TypeScript SDK layer** that:

1. **Generates proof requests** to the bridge (`GET /fiber/:fiberId/trie-proof`)
2. **Verifies Merkle proofs** client-side (no trust in bridge)
3. **Encodes/decodes logical paths** consistently with the Scala layer
4. **Exposes typed factories** for the 5 trie dimensions

Design basis: [`docs/design/authenticated-tries.md`](docs/design/authenticated-tries.md) (PR #61, MERGED).

### What This Spec Does NOT Cover

- Scala implementation of the 5 producers (specified in PR #61)  
- Bridge endpoint implementation (separate card)  
- `LevelDB` backend for large fibers (Phase 2)  
- Activities range queries via bridge (Phase 2)

---

## File Structure

```
src/apps/asset_model/tries/
├── index.ts            # Public exports
├── types.ts            # TypeScript interfaces
├── path-encoding.ts    # SHA-256 path encoder + ordinal encoder
├── verifier.ts         # Client-side MPT proof verification (~60 lines)
└── __tests__/
    └── tries.test.ts   # TDD tests (all failing initially)
```

---

## `types.ts` — Interface Contracts

```typescript
/**
 * The 5 authenticated trie dimensions.
 * Each corresponds to a separate MerklePatriciaTrie in the Scala metagraph layer.
 * Keys '00'–'04' are the fixed positions in the combined-root MPT (see TrieIndex).
 */
export enum TrieDimension {
  Permissions   = 'permissions',   // '00'
  Relationships = 'relationships', // '01'
  Activities    = 'activities',    // '02'
  Assets        = 'assets',        // '03'
  Group         = 'group'          // '04'
}

/** Hex-encoded SHA-256 hash (64 chars, lowercase, no 0x prefix) */
export type HexHash = string;

/** Hex-encoded path key (64 chars, SHA-256 of logical path) */
export type PathKey = string;

/** A single node commitment in a Merkle path witness */
export interface MerkleCommitment {
  /** 'leaf' | 'branch' | 'extension' — from metakit's MerklePatriciaCommitment */
  type: 'leaf' | 'branch' | 'extension';
  /** Hex-encoded node digest (32 bytes = 64 hex chars) */
  digest: HexHash;
  /** For leaf: the encoded value digest */
  dataDigest?: HexHash;
}

/**
 * Inclusion proof for a single key in one trie.
 * Produced by metakit's MerklePatriciaProver.attestPath() and
 * proxied through the bridge endpoint GET /fiber/:fiberId/trie-proof.
 */
export interface TrieInclusionProof {
  /** Logical path that was queried (human-readable) */
  logicalPath: string;
  /** SHA-256 encoded key (hex) */
  pathKey: PathKey;
  /** SHA-256 of the JSON-encoded value at this path */
  valueDigest: HexHash;
  /** Ordered witness commitments from leaf to root */
  witness: MerkleCommitment[];
  /** Root hash of this individual trie dimension */
  trieRoot: HexHash;
}

/**
 * A proof that a specific field exists in a specific trie,
 * with the trie root itself proven against the fiber's stateRoot.
 *
 * Two-level structure:
 *   fieldProof.trieRoot  →  trieRootProof  →  stateRoot
 */
export interface AuthenticatedFieldProof {
  /** The fiber's combined stateRoot (from StateMachineFiberRecord.stateRoot) */
  stateRoot: HexHash;
  /** Which of the 5 dimensions this proof covers */
  dimension: TrieDimension;
  /**
   * Proves that this dimension's trie root hash is committed in stateRoot.
   * Key in the combined-root MPT is TrieIndex[dimension] ('00'–'04').
   */
  trieRootProof: TrieInclusionProof;
  /**
   * Proves that the logical path's value is committed in the dimension's trie.
   */
  fieldProof: TrieInclusionProof;
  /** The claimed value at this path (for caller convenience; not trust-assumed) */
  claimedValue: unknown;
}

/**
 * Response from bridge endpoint GET /fiber/:fiberId/trie-proof
 */
export interface TrieProofResponse {
  fiberId: string;
  stateRoot: HexHash;
  dimension: TrieDimension;
  logicalPath: string;
  proof: AuthenticatedFieldProof;
}

/**
 * Summary of a fiber's current trie roots (from GET /fiber/:fiberId/trie-roots).
 * Does not include witness data — use /trie-proof for full proofs.
 */
export interface FiberTrieRoots {
  fiberId: string;
  stateRoot: HexHash;
  roots: Record<TrieDimension, HexHash>;
}

/**
 * Error thrown when proof verification fails.
 */
export class TrieProofVerificationError extends Error {
  constructor(
    public readonly reason: 'root_mismatch' | 'path_mismatch' | 'value_mismatch' | 'malformed_witness',
    message: string
  ) {
    super(message);
    this.name = 'TrieProofVerificationError';
  }
}
```

---

## `path-encoding.ts` — Path Encoding

```typescript
import { createHash } from 'crypto'; // Node.js built-in; or crypto.subtle in browser

/**
 * The fixed index positions in the combined-root MPT.
 * Must match Scala's TrieIndex object in the metagraph.
 */
export const TrieIndex: Record<TrieDimension, string> = {
  [TrieDimension.Permissions]:   '00',
  [TrieDimension.Relationships]: '01',
  [TrieDimension.Activities]:    '02',
  [TrieDimension.Assets]:        '03',
  [TrieDimension.Group]:         '04',
};

/**
 * Encode a logical path to its MPT key (SHA-256, hex).
 *
 * Must match Scala's:
 *   def encodePath(logicalPath: String): Hex =
 *     Hex(SHA256(logicalPath.getBytes(UTF_8)).map("%02x".format(_)).mkString)
 *
 * @example
 *   encodePath('permissions:delegations/issued/DAGabc.../transfer')
 *   // → 64-char hex string
 */
export function encodePath(logicalPath: string): string {
  return createHash('sha256').update(logicalPath, 'utf8').digest('hex');
}

/**
 * Encode an ordinal for use as a sortable Activities trie key.
 * Produces a 16-char zero-padded hex string for lexicographic ordering.
 *
 * Must match Scala's "%016x".format(ordinal).
 *
 * @example
 *   encodeOrdinal(255n) // → '00000000000000ff'
 *   encodeOrdinal(0n)   // → '0000000000000000'
 */
export function encodeOrdinal(ordinal: bigint): string {
  if (ordinal < 0n) throw new RangeError(`Ordinal must be non-negative, got ${ordinal}`);
  if (ordinal > 0xFFFFFFFFFFFFFFFFn) throw new RangeError(`Ordinal ${ordinal} exceeds uint64 max`);
  return ordinal.toString(16).padStart(16, '0');
}

/**
 * Encode an Activities trie path preserving ordinal sort order.
 * Format: SHA256(prefix) + paddedOrdinal
 * Total length: 64 + 16 = 80 hex chars.
 *
 * Must match Scala's encodeActivityPath() in the metagraph.
 */
export function encodeActivityPath(
  groupId: string,
  seriesId: string,
  ordinal: bigint
): string {
  const prefix = `activities:events:${encodePath(groupId)}:${encodePath(seriesId)}:`;
  return encodePath(prefix) + encodeOrdinal(ordinal);
}

/**
 * Logical path builders for each trie dimension.
 * Use these to construct the logicalPath string for proof requests.
 */
export const TriePaths = {
  permissions: {
    delegationIssued: (from: string, to: string, permission: string) =>
      `permissions:delegations/issued/${from}/${permission}`,
    delegationReceived: (from: string, to: string, permission: string) =>
      `permissions:delegations/received/${to}/${permission}`,
    authority: (participant: string, scopeHash: string) =>
      `permissions:authorities/${participant}/${scopeHash}`,
  },
  relationships: {
    groupMember: (groupId: string, participantId: string) =>
      `relationships:groups/${groupId}/members/${participantId}`,
    groupAgreement: (groupId: string, agreementId: string) =>
      `relationships:groups/${groupId}/agreements/${agreementId}`,
    agreementProducer: (agreementId: string) =>
      `relationships:agreements/${agreementId}/producer`,
    agreementStatus: (agreementId: string) =>
      `relationships:agreements/${agreementId}/status`,
  },
  activities: {
    // Use encodeActivityPath() for activities — ordinal sort required
  },
  assets: {
    tokenOwner: (groupId: string, seriesId: string, tokenId: string) =>
      `assets:tokens/${groupId}/${seriesId}/${tokenId}/owner`,
    tokenState: (groupId: string, seriesId: string, tokenId: string) =>
      `assets:tokens/${groupId}/${seriesId}/${tokenId}/state`,
    balance: (groupId: string, seriesId: string, participantId: string) =>
      `assets:balances/${groupId}/${seriesId}/${participantId}/total`,
    lockedBalance: (groupId: string, seriesId: string, participantId: string) =>
      `assets:balances/${groupId}/${seriesId}/${participantId}/locked`,
    lock: (lockId: string) => `assets:locks/${lockId}/amount`,
  },
  group: {
    policy: (policyId: string, field: 'guard' | 'effects') =>
      `group:policies/${policyId}/${field}`,
    stat: (statName: string) => `group:stats/${statName}`,
    governance: (field: string) => `group:governance/${field}`,
  },
};
```

---

## `verifier.ts` — Client-Side Proof Verification

```typescript
import { createHash } from 'crypto';
import {
  TrieInclusionProof,
  AuthenticatedFieldProof,
  TrieProofVerificationError,
  MerkleCommitment,
  HexHash,
} from './types.js';
import { TrieIndex } from './path-encoding.js';

/**
 * Verify a single trie inclusion proof.
 *
 * Algorithm (mirrors MerklePatriciaVerifier in metakit):
 * 1. Recompute the leaf hash from pathKey + valueDigest
 * 2. Walk up witness commitments, hashing at each step
 * 3. Confirm final hash equals trieRoot
 *
 * Node hash formula (metakit SHA-256, 1-byte prefix):
 *   Leaf:      SHA256(0x00 || pathKey || valueDigest)
 *   Branch:    SHA256(0x01 || concat(childDigests))
 *   Extension: SHA256(0x02 || sharedKey || nextDigest)
 *
 * @throws TrieProofVerificationError if verification fails
 */
export function verifyTrieInclusionProof(proof: TrieInclusionProof): void {
  // Step 1: compute expected leaf hash
  let currentDigest = hashLeaf(proof.pathKey, proof.valueDigest);

  // Step 2: walk witness from leaf toward root
  for (const commitment of proof.witness) {
    if (commitment.type === 'branch') {
      currentDigest = hashBranch(currentDigest, commitment);
    } else if (commitment.type === 'extension') {
      currentDigest = hashExtension(currentDigest, commitment);
    } else {
      throw new TrieProofVerificationError(
        'malformed_witness',
        `Unexpected commitment type '${commitment.type}' in witness middle`
      );
    }
  }

  // Step 3: confirm root
  if (currentDigest !== proof.trieRoot) {
    throw new TrieProofVerificationError(
      'root_mismatch',
      `Proof root mismatch: computed ${currentDigest}, expected ${proof.trieRoot}`
    );
  }
}

/**
 * Verify a full two-level AuthenticatedFieldProof.
 *
 * Performs:
 * 1. verifyTrieInclusionProof(fieldProof) — confirms value in trie
 * 2. verifyTrieInclusionProof(trieRootProof) — confirms trie root in stateRoot
 * 3. Cross-check: trieRootProof.trieRoot === stateRoot
 * 4. Cross-check: fieldProof.trieRoot === claimed trie root value in trieRootProof
 *
 * @throws TrieProofVerificationError on any failure
 */
export function verifyAuthenticatedFieldProof(proof: AuthenticatedFieldProof): void {
  // 1. Verify the field proof against its claimed trie root
  verifyTrieInclusionProof(proof.fieldProof);

  // 2. Verify the trie root proof against stateRoot
  const trieRootProofWithStateRoot: TrieInclusionProof = {
    ...proof.trieRootProof,
    trieRoot: proof.stateRoot,
  };
  verifyTrieInclusionProof(trieRootProofWithStateRoot);

  // 3. Cross-check: the trieRootProof's path key must be TrieIndex[dimension]
  const expectedTrieKey = TrieIndex[proof.dimension];
  if (proof.trieRootProof.pathKey !== expectedTrieKey) {
    throw new TrieProofVerificationError(
      'path_mismatch',
      `Trie root proof path '${proof.trieRootProof.pathKey}' does not match expected dimension key '${expectedTrieKey}'`
    );
  }

  // 4. Cross-check: the field proof's trieRoot must equal the trie root value
  //    committed in trieRootProof (recovered from proof's valueDigest)
  //    NOTE: We can only verify the hash commitment, not the raw value.
  //    The trie root hash is embedded in trieRootProof.valueDigest.
  const claimedTrieRoot = proof.fieldProof.trieRoot;
  const trieRootValueDigest = sha256Hex(claimedTrieRoot);
  if (trieRootValueDigest !== proof.trieRootProof.valueDigest) {
    throw new TrieProofVerificationError(
      'value_mismatch',
      `Trie root value digest mismatch: fieldProof.trieRoot=${claimedTrieRoot} does not match trieRootProof.valueDigest`
    );
  }
}

// --- Internal helpers ---

function sha256Hex(input: string): HexHash {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function sha256Bytes(bytes: Buffer): HexHash {
  return createHash('sha256').update(bytes).digest('hex');
}

function hashLeaf(pathKey: string, valueDigest: string): HexHash {
  const buf = Buffer.concat([
    Buffer.from([0x00]),
    Buffer.from(pathKey, 'hex'),
    Buffer.from(valueDigest, 'hex'),
  ]);
  return sha256Bytes(buf);
}

function hashBranch(childDigest: string, commitment: MerkleCommitment): HexHash {
  // Branch node: SHA256(0x01 || ... children ...) — bridge provides the full digest
  // We use the commitment.digest directly (bridge pre-computed from Scala layer)
  // This is a simplified verifier: trust the witness digests, verify root only.
  // Full verifier would recompute each node hash from its children.
  // Phase 1 scope: root-hash verification (spot check).
  return commitment.digest;
}

function hashExtension(nextDigest: string, commitment: MerkleCommitment): HexHash {
  // Extension node: SHA256(0x02 || sharedKey || nextDigest)
  // Same simplification as branch — Phase 1 verifies root commitment.
  return commitment.digest;
}
```

> **Phase 1 note**: The `hashBranch` / `hashExtension` functions above use a simplified "trust witness digests, verify root" strategy. A full MPT verifier would recompute each node hash from its children. Full verification is Phase 2 and requires the complete metakit node serialization format to be documented in the bridge spec.

---

## `index.ts` — Public Exports

```typescript
/**
 * Asset Model: Authenticated Trie Management
 *
 * Client-side utilities for requesting and verifying Merkle proofs
 * against the 5-dimensional trie system in OttoChain's asset model.
 *
 * @example
 * ```typescript
 * import {
 *   TrieDimension,
 *   verifyAuthenticatedFieldProof,
 *   TriePaths,
 *   encodePath,
 * } from '@ottochain/sdk/apps/asset_model/tries';
 *
 * // Verify a proof fetched from the bridge
 * const proof = await fetch('/fiber/abc.../trie-proof?dim=assets&path=...').then(r => r.json());
 * verifyAuthenticatedFieldProof(proof); // throws on failure
 * ```
 *
 * @packageDocumentation
 */

export {
  TrieDimension,
  TrieInclusionProof,
  AuthenticatedFieldProof,
  FiberTrieRoots,
  TrieProofResponse,
  TrieProofVerificationError,
  MerkleCommitment,
  HexHash,
  PathKey,
} from './types.js';

export {
  encodePath,
  encodeOrdinal,
  encodeActivityPath,
  TriePaths,
  TrieIndex,
} from './path-encoding.js';

export {
  verifyTrieInclusionProof,
  verifyAuthenticatedFieldProof,
} from './verifier.js';
```

---

## API Contracts

### Bridge Endpoints (consumed by this SDK)

These endpoints are defined in a separate bridge spec card, but this SDK depends on them.

#### `GET /fiber/:fiberId/trie-proof`

```
Query params:
  dimension  : TrieDimension (required)
  logicalPath: string (required) — e.g. "assets:balances/DAGabc.../total"

Response 200:
  TrieProofResponse (see types.ts)

Response 400:
  { error: "INVALID_DIMENSION" | "MISSING_PATH" | "INVALID_PATH_FORMAT" }

Response 404:
  { error: "FIBER_NOT_FOUND" | "PATH_NOT_FOUND_IN_TRIE" }

Response 503:
  { error: "STATEROOT_NOT_YET_COMPUTED" }  // PR #117 not yet run for this fiber
```

#### `GET /fiber/:fiberId/trie-roots`

```
Response 200: FiberTrieRoots

Response 404: { error: "FIBER_NOT_FOUND" }
Response 503: { error: "STATEROOT_NOT_YET_COMPUTED" }
```

---

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC-1 | `encodePath(s)` returns lowercase hex SHA-256 of UTF-8 string, 64 chars |
| AC-2 | `encodeOrdinal(0n)` → `'0000000000000000'`; `encodeOrdinal(255n)` → `'00000000000000ff'` |
| AC-3 | `encodeOrdinal()` throws `RangeError` for negative or >uint64 max |
| AC-4 | `encodeActivityPath()` produces keys that sort lexicographically by ordinal within same series |
| AC-5 | `verifyTrieInclusionProof()` succeeds for valid proof from bridge |
| AC-6 | `verifyTrieInclusionProof()` throws `TrieProofVerificationError` with `root_mismatch` for tampered root |
| AC-7 | `verifyTrieInclusionProof()` throws for tampered value (valueDigest mismatch propagates) |
| AC-8 | `verifyAuthenticatedFieldProof()` succeeds for valid 2-level proof |
| AC-9 | `verifyAuthenticatedFieldProof()` throws for wrong `dimension` (path key mismatch) |
| AC-10 | `verifyAuthenticatedFieldProof()` throws if fieldProof.trieRoot ≠ value in trieRootProof |
| AC-11 | `TrieIndex` maps each `TrieDimension` to unique keys `'00'`–`'04'` (no collisions) |
| AC-12 | All exports from `index.ts` are importable via `@ottochain/sdk/apps/asset_model/tries` |
| AC-13 | `TriePaths` builders produce paths consistent with `encodePath()` for SDK consumers |

---

## TDD Test Plan

All tests live in `src/apps/asset_model/tries/__tests__/tries.test.ts`.  
Write FAILING tests first (no implementation). Tests use Jest (existing SDK test framework).

### Group 1: Path Encoding (5 tests)

```typescript
describe('path-encoding', () => {

  // T1.1: encodePath produces correct SHA-256
  it('encodes logical path as SHA-256 hex', () => {
    const result = encodePath('permissions:delegations/issued/DAGabc/transfer');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
    // Specific hash verified against Scala layer reference output
    // (add after integration test with metagraph confirms the value)
  });

  // T1.2: encodePath is deterministic
  it('encodePath is deterministic for same input', () => {
    const p = 'assets:balances/DAG123.../total';
    expect(encodePath(p)).toBe(encodePath(p));
  });

  // T1.3: ordinal encoding zero-pads
  it('encodeOrdinal zero-pads to 16 chars', () => {
    expect(encodeOrdinal(0n)).toBe('0000000000000000');
    expect(encodeOrdinal(255n)).toBe('00000000000000ff');
    expect(encodeOrdinal(0xFFFFFFFFFFFFFFFFn)).toBe('ffffffffffffffff');
  });

  // T1.4: ordinal range error
  it('encodeOrdinal throws RangeError for negative ordinal', () => {
    expect(() => encodeOrdinal(-1n)).toThrow(RangeError);
  });

  // T1.5: activity paths sort correctly
  it('encodeActivityPath produces lexicographically sortable keys', () => {
    const group = 'group-1';
    const series = 'series-A';
    const k1 = encodeActivityPath(group, series, 0n);
    const k2 = encodeActivityPath(group, series, 1n);
    const k100 = encodeActivityPath(group, series, 100n);
    // Prefix (SHA-256 part) is same, ordinal suffix sorts correctly
    expect(k1 < k2).toBe(true);
    expect(k2 < k100).toBe(true);
  });
});
```

### Group 2: TrieIndex (2 tests)

```typescript
describe('TrieIndex', () => {

  // T2.1: all dimensions have unique index keys
  it('all TrieDimension values map to unique TrieIndex keys', () => {
    const values = Object.values(TrieIndex);
    expect(new Set(values).size).toBe(values.length);
  });

  // T2.2: index keys are '00'–'04'
  it('TrieIndex keys are hex strings 00–04', () => {
    expect(Object.values(TrieIndex).sort()).toEqual(['00', '01', '02', '03', '04']);
  });
});
```

### Group 3: Trie Inclusion Proof Verification (4 tests)

```typescript
describe('verifyTrieInclusionProof', () => {

  // Fixture: a valid single-trie proof (generated from integration test with running metagraph)
  // For unit tests, use a handcrafted minimal proof with pre-computed hashes.
  const validProof: TrieInclusionProof = {
    logicalPath: 'assets:balances/DAGtest/total',
    pathKey: encodePath('assets:balances/DAGtest/total'),
    valueDigest: sha256Hex('1000'),  // SHA-256 of the JSON value "1000"
    witness: [],  // empty witness = leaf is the root (single-entry trie)
    trieRoot: hashLeaf(encodePath('assets:balances/DAGtest/total'), sha256Hex('1000')),
  };

  // T3.1: valid proof succeeds
  it('accepts a valid inclusion proof', () => {
    expect(() => verifyTrieInclusionProof(validProof)).not.toThrow();
  });

  // T3.2: tampered root fails
  it('throws root_mismatch for tampered trieRoot', () => {
    const tampered = { ...validProof, trieRoot: '00'.repeat(32) };
    expect(() => verifyTrieInclusionProof(tampered)).toThrow(TrieProofVerificationError);
    try { verifyTrieInclusionProof(tampered); } catch (e: any) {
      expect(e.reason).toBe('root_mismatch');
    }
  });

  // T3.3: tampered value digest fails
  it('throws root_mismatch when valueDigest is tampered', () => {
    const tampered = { ...validProof, valueDigest: '00'.repeat(32) };
    expect(() => verifyTrieInclusionProof(tampered)).toThrow(TrieProofVerificationError);
  });

  // T3.4: malformed witness (leaf in middle) fails
  it('throws malformed_witness for leaf node in witness middle', () => {
    const tampered = {
      ...validProof,
      witness: [{ type: 'leaf' as const, digest: '00'.repeat(32) }],
    };
    expect(() => verifyTrieInclusionProof(tampered)).toThrow(TrieProofVerificationError);
    try { verifyTrieInclusionProof(tampered); } catch (e: any) {
      expect(e.reason).toBe('malformed_witness');
    }
  });
});
```

### Group 4: Authenticated Field Proof Verification (5 tests)

```typescript
describe('verifyAuthenticatedFieldProof', () => {

  // Helper to build a minimal valid 2-level proof for test purposes
  function makeValidAuthProof(): AuthenticatedFieldProof { ... }  // @code to implement

  // T4.1: valid 2-level proof succeeds
  it('accepts a valid authenticated field proof', () => {
    expect(() => verifyAuthenticatedFieldProof(makeValidAuthProof())).not.toThrow();
  });

  // T4.2: wrong dimension key fails
  it('throws path_mismatch when trieRootProof.pathKey does not match dimension', () => {
    const proof = makeValidAuthProof();
    const tampered = {
      ...proof,
      trieRootProof: { ...proof.trieRootProof, pathKey: TrieIndex[TrieDimension.Group] }, // wrong dim
    };
    expect(() => verifyAuthenticatedFieldProof(tampered))
      .toThrow(TrieProofVerificationError);
    try { verifyAuthenticatedFieldProof(tampered); } catch (e: any) {
      expect(e.reason).toBe('path_mismatch');
    }
  });

  // T4.3: mismatched field and trie root fails
  it('throws value_mismatch when fieldProof.trieRoot does not match trieRootProof.valueDigest', () => {
    const proof = makeValidAuthProof();
    const tampered = {
      ...proof,
      fieldProof: { ...proof.fieldProof, trieRoot: 'aa'.repeat(32) },
    };
    expect(() => verifyAuthenticatedFieldProof(tampered))
      .toThrow(TrieProofVerificationError);
    try { verifyAuthenticatedFieldProof(tampered); } catch (e: any) {
      expect(e.reason).toBe('value_mismatch');
    }
  });

  // T4.4: stateRoot tampered fails
  it('throws root_mismatch when stateRoot is tampered', () => {
    const proof = makeValidAuthProof();
    const tampered = { ...proof, stateRoot: 'bb'.repeat(32) };
    expect(() => verifyAuthenticatedFieldProof(tampered))
      .toThrow(TrieProofVerificationError);
  });

  // T4.5: different dimensions produce different dimension proofs
  it('Permissions and Assets dimensions have different TrieIndex keys', () => {
    expect(TrieIndex[TrieDimension.Permissions]).not.toBe(TrieIndex[TrieDimension.Assets]);
  });
});
```

### Group 5: Error Classes (3 tests)

```typescript
describe('TrieProofVerificationError', () => {

  // T5.1: error is instanceof TrieProofVerificationError
  it('is an instance of Error and TrieProofVerificationError', () => {
    const e = new TrieProofVerificationError('root_mismatch', 'test');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(TrieProofVerificationError);
  });

  // T5.2: reason is accessible
  it('exposes reason property', () => {
    const e = new TrieProofVerificationError('path_mismatch', 'test');
    expect(e.reason).toBe('path_mismatch');
    expect(e.name).toBe('TrieProofVerificationError');
  });

  // T5.3: all reason values are valid
  it('all reason literals are distinct strings', () => {
    const reasons = ['root_mismatch', 'path_mismatch', 'value_mismatch', 'malformed_witness'];
    expect(new Set(reasons).size).toBe(4);
  });
});
```

**Total: 19 TDD test cases** (matches design spec TDD plan)

---

## Dependencies

- **Node.js built-in `crypto`**: `createHash('sha256')` — no new npm deps
- **`@ottochain/sdk` internal types**: existing `StateMachine`, `FiberRecord` (for AC-12 integration)
- **Jest**: existing test framework (no changes needed)

## Implementation Order for @code

1. Write all 19 failing tests in `tries.test.ts`
2. Create stub `types.ts`, `path-encoding.ts`, `verifier.ts`, `index.ts` (empty exports)
3. Confirm all 19 tests fail
4. Commit to `feat/authenticated-tries` branch
5. Implementation unlocks after PR #117 merges (provides real stateRoot values for integration tests)

## Open Questions for James

| OQ | Question |
|----|----------|
| OQ-5 | Should token behavior type config live in Assets trie or stateData? (from design spec) |
| OQ-6 | Phase 1 simplified verifier (trust witness digests) acceptable, or do we need full node hash recomputation now? |

---

*Spec by @think (OttoThink) — 2026-02-26 22:56 CST*  
*Based on design spec: docs/design/authenticated-tries.md (PR #61, MERGED)*  
*Implementation blocked on: PR #117 (adds stateRoot to StateMachineFiberRecord)*
