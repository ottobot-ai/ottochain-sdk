/**
 * Light-client verification of committed state proofs.
 *
 * The chain's `/state-machines|scripts|assets/{id}/state-proof` endpoints return a
 * {@link StateProof}: the record plus a Merkle-Patricia inclusion proof against `mptRoot`,
 * whose combined hash IS the snapshot's consensus-signed `calculatedStateProof`. Verifying
 * the proof locally means trusting NO serving node — only snapshot consensus.
 *
 * The fold mirrors metakit's `MerklePatriciaVerifier` byte-for-byte (validated against live
 * cluster proofs):
 *
 *  - the response `witness` is DEEPEST-FIRST (leaf-first for inclusion); verification walks
 *    it reversed (root-first);
 *  - every node's digest = `sha256(typePrefix ++ utf8(JCS(dropNulls(contents))))` over the
 *    commitment's SUBTYPE (contents-only) encoding — prefixes: leaf `0x00`, branch `0x01`,
 *    extension `0x02`;
 *  - a Branch consumes one path nibble via `pathsDigest`; an Extension consumes its `shared`
 *    nibbles (which MUST be a prefix of the remaining path — the metakit#60 soundness rule)
 *    and continues at `childDigest`;
 *  - INCLUSION: the terminal Leaf must match the remaining path (`remaining`) and bind
 *    `dataDigest == sha256(JCS(dropNulls(record)))` (no prefix);
 *  - ABSENCE (metakit#60 `MerklePatriciaProof.Absence` — the `{type:"Absence",path,witness}`
 *    wire tag): the SAME fold, but the terminal (deepest) commitment must hash to the digest
 *    the fold reached AND structurally refuse the next step — a Branch whose remaining path
 *    is EMPTY (branches carry no value slot) or whose `pathsDigest` lacks the next nibble; an
 *    Extension whose `shared` is NOT a prefix of the remaining path; or a Leaf whose
 *    `remaining` differs from the query tail (another key occupies the position);
 *  - the trie path of a committed key is `hex(utf8(key))` (metakit `CommitKey.toHex`), e.g.
 *    `fiber/<uuid>` → `66696265722f…`.
 *
 * NOTE: this intentionally does NOT route through the JLVM `mpt_verify` opcode — the
 * TypeScript port of that opcode mis-canonicalizes non-scalar leaf values (fiber records)
 * and returns false; its conformance vectors only cover scalar leaves. The Scala (chain)
 * side is correct. Once the port is fixed upstream this helper stays valid either way: it
 * is the same algorithm without the JsonLogic value-domain round-trip.
 */
import { canonicalize } from '@constellation-network/metagraph-sdk';
import { sha256 } from '@noble/hashes/sha256.js';
import type { StateProof } from './metagraph-client.js';

/** One commitment node of a Merkle-Patricia witness (wire form, deepest-first). */
export interface MptWitnessNode {
  type: 'Leaf' | 'Branch' | 'Extension';
  contents: {
    /** Leaf: the path nibbles left below the last branch. */
    remaining?: string;
    /** Leaf: sha256(JCS(dropNulls(value))) of the committed record. */
    dataDigest?: string;
    /** Branch: nibble → child node digest. */
    pathsDigest?: Record<string, string>;
    /** Extension: the shared nibble run. */
    shared?: string;
    /** Extension: digest of the child branch. */
    childDigest?: string;
  };
}

/** The `proof` field of a {@link StateProof}, typed. */
export interface MptInclusionProof {
  /**
   * Sealed-proof discriminator (metakit `MerklePatriciaProof`). Absent on the legacy
   * standalone inclusion wire (`{path, witness}`), `"Inclusion"` on the tagged form —
   * the two encode the witness identically.
   */
  type?: 'Inclusion';
  /** Trie path = hex(utf8(committed key)). */
  path: string;
  witness: MptWitnessNode[];
}

/**
 * A Merkle-Patricia ABSENCE (non-inclusion) proof — metakit#60 `MerklePatriciaProof.Absence`.
 * `witness` is the root-to-divergence commitment chain, DEEPEST-FIRST like inclusion; its
 * first element is the TERMINAL commitment at which the queried path cannot continue.
 */
export interface MptAbsenceProof {
  type: 'Absence';
  /** Trie path = hex(utf8(queried key)). */
  path: string;
  witness: MptWitnessNode[];
}

/**
 * The sealed proof union (metakit `MerklePatriciaProof` wire contract): a tagged
 * `Inclusion`/`Absence`, or the legacy un-tagged `{path, witness}` inclusion shape.
 */
export type MptProof = MptInclusionProof | MptAbsenceProof;

/** Verification outcome: `ok`, or the first failed binding with a human-readable reason. */
export type StateProofVerification = { ok: true } | { ok: false; reason: string };

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

const toHexStr = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

/** `sha256(prefixByte? ++ utf8(JCS(dropNulls(value))))` — the chain's content-digest rule. */
function jcsSha256(value: unknown, prefix?: number): string {
  const canonical = utf8(canonicalize(value));
  if (prefix === undefined) return toHexStr(sha256(canonical));
  const framed = new Uint8Array(1 + canonical.length);
  framed[0] = prefix;
  framed.set(canonical, 1);
  return toHexStr(sha256(framed));
}

/** The MPT trie path of a committed key — `hex(utf8(key))` (metakit `CommitKey.toHex`). */
export function commitKeyPath(key: string): string {
  return toHexStr(utf8(key));
}

const NODE_PREFIX: Record<MptWitnessNode['type'], number> = { Leaf: 0, Branch: 1, Extension: 2 };

/** Internal: outcome of walking the witness root-first down to (and including) the terminal. */
type FoldOutcome =
  { ok: true; terminal: MptWitnessNode; terminalDepth: number; remainingPath: string } | { ok: false; reason: string };

/**
 * The shared root-first fold over a DEEPEST-FIRST witness (metakit `MerklePatriciaVerifier`):
 * every non-terminal node's digest is recomputed with its type prefix and bound to the digest
 * threaded from the root; a Branch consumes one nibble via `pathsDigest`, an Extension its
 * `shared` run (which MUST prefix the remaining path — metakit#60), and a Leaf may appear
 * ONLY as the terminal. The TERMINAL node's own digest binding is done here too (mirroring
 * `verifyAbsenceTerminal`/`verifyLeaf`); the caller applies the arm-specific terminal
 * assertion (inclusion match vs. structural refusal).
 */
function foldWitness(mptRoot: string, key: string, proof: { path: string; witness: MptWitnessNode[] }): FoldOutcome {
  const fail = (reason: string): FoldOutcome => ({ ok: false, reason });
  if (!proof || typeof proof.path !== 'string' || !Array.isArray(proof.witness) || proof.witness.length === 0)
    return fail('malformed proof (missing path/witness)');

  const expectedPath = commitKeyPath(key);
  if (proof.path.toLowerCase() !== expectedPath) return fail(`trie path != hex(utf8("${key}"))`);

  let digest = String(mptRoot).replace(/^0x/, '').toLowerCase();
  let path = proof.path.toLowerCase();
  const nodes = [...proof.witness].reverse(); // wire is deepest-first; fold root-first

  for (const [depth, node] of nodes.entries()) {
    const isLast = depth === nodes.length - 1;
    const prefix = NODE_PREFIX[node?.type as MptWitnessNode['type']];
    if (prefix === undefined) return fail(`unknown witness node type '${String(node?.type)}'`);
    if (jcsSha256(node.contents, prefix) !== digest)
      return fail(`${node.type.toLowerCase()} commitment mismatch at depth ${depth}`);

    if (isLast) return { ok: true, terminal: node, terminalDepth: depth, remainingPath: path };

    if (node.type === 'Branch') {
      const child = node.contents.pathsDigest?.[path[0]];
      if (!child) return fail(`branch has no child at nibble '${path[0]}' (depth ${depth})`);
      digest = child.toLowerCase();
      path = path.slice(1);
    } else if (node.type === 'Extension') {
      const shared = String(node.contents.shared ?? '').toLowerCase();
      if (!path.startsWith(shared)) return fail(`extension shared-nibble mismatch at depth ${depth}`);
      path = path.slice(shared.length);
      digest = String(node.contents.childDigest ?? '').toLowerCase();
    } else {
      // A Leaf has no child to continue into — it can only be the deepest commitment.
      return fail('leaf before end of witness');
    }
  }
  // Unreachable: the loop always returns at `isLast`.
  return fail('witness does not terminate');
}

/**
 * Verify a Merkle-Patricia inclusion proof: `record` is committed at `key` under `mptRoot`.
 *
 * Pure and side-effect free; never throws on malformed input (returns `{ ok: false }`).
 */
export function verifyMptInclusion(
  mptRoot: string,
  key: string,
  record: unknown,
  proof: MptInclusionProof,
): StateProofVerification {
  const folded = foldWitness(mptRoot, key, proof);
  if (!folded.ok) return folded;

  const { terminal, remainingPath } = folded;
  if (terminal.type !== 'Leaf') return { ok: false, reason: 'witness does not terminate in a leaf' };
  if (String(terminal.contents.remaining ?? '').toLowerCase() !== remainingPath)
    return { ok: false, reason: 'leaf remaining-path mismatch' };
  if (String(terminal.contents.dataDigest ?? '').toLowerCase() !== jcsSha256(record))
    return { ok: false, reason: 'leaf dataDigest != sha256(JCS(record))' };
  return { ok: true };
}

/**
 * Verify a Merkle-Patricia ABSENCE proof: NO value is committed at `key` under `mptRoot`
 * (metakit#60 `MerklePatriciaVerifier.confirmAbsence`, ported condition-for-condition).
 *
 * The witness replays the SAME root-first fold as inclusion; the terminal (deepest)
 * commitment must hash to the digest the fold reached AND structurally refuse the next step:
 *
 *  - `Branch` — the remaining path is EMPTY (branches carry no value slot, so a path ending
 *    at a branch is necessarily absent) OR `pathsDigest` lacks the next nibble;
 *  - `Extension` — `shared` is NOT a prefix of the remaining path (divergence mid-edge,
 *    including a remaining path shorter than the edge);
 *  - `Leaf` — `remaining` differs from the remaining path (a different key occupies the
 *    position).
 *
 * A terminal that could continue (or a Leaf that MATCHES) proves nothing: `{ ok: false }`.
 * Pure and side-effect free; never throws on malformed input.
 */
export function verifyMptAbsence(
  mptRoot: string,
  key: string,
  proof: MptAbsenceProof | { path: string; witness: MptWitnessNode[] },
): StateProofVerification {
  const folded = foldWitness(mptRoot, key, proof);
  if (!folded.ok) return folded;

  const { terminal, remainingPath } = folded;
  let witnessesAbsence: boolean;
  if (terminal.type === 'Branch') {
    witnessesAbsence = remainingPath.length === 0 || !(terminal.contents.pathsDigest ?? {})[remainingPath[0]];
  } else if (terminal.type === 'Extension') {
    witnessesAbsence = !remainingPath.startsWith(String(terminal.contents.shared ?? '').toLowerCase());
  } else {
    witnessesAbsence = String(terminal.contents.remaining ?? '').toLowerCase() !== remainingPath;
  }
  return witnessesAbsence
    ? { ok: true }
    : { ok: false, reason: 'terminal commitment does not witness absence of the path' };
}

/**
 * Verify a sealed {@link MptProof} — inclusion OR absence — dispatching on the wire `type`
 * tag (metakit `MerklePatriciaProof`). A legacy un-tagged `{path, witness}` proof is an
 * inclusion (the tagged `Inclusion` encoding is byte-identical plus the tag).
 *
 * `record` is the committed value an INCLUSION proof attests; an ABSENCE proof attests no
 * record, so passing one alongside an `Absence` tag is a contract mismatch and fails.
 */
export function verifyMptProof(mptRoot: string, key: string, record: unknown, proof: MptProof): StateProofVerification {
  const tag = proof?.type;
  if (tag === 'Absence') {
    if (record !== undefined && record !== null) return { ok: false, reason: 'absence proof cannot attest a record' };
    return verifyMptAbsence(mptRoot, key, proof);
  }
  if (tag === undefined || tag === 'Inclusion') return verifyMptInclusion(mptRoot, key, record, proof);
  return { ok: false, reason: `unknown proof type '${String(tag)}'` };
}

/**
 * Verify a whole {@link StateProof} response for a committed key.
 *
 * Checks the trie inclusion of `record` at `key` under the response's `mptRoot` (see
 * {@link verifyMptInclusion}). The caller supplies the key it EXPECTS (`fiber/<id>`,
 * `script/<id>`, `asset/<id>`, …) so a proof for some other record cannot be substituted;
 * the response's own `key` field must agree.
 *
 * Trust anchor: `committedRoot` (= `sha256(mptRoot ++ catalogRoot)`) rides in the
 * consensus-signed snapshot as `calculatedStateProof`; binding `mptRoot` to a snapshot is
 * the caller's (or a snapshot-following light client's) responsibility.
 */
export function verifyStateProof(resp: StateProof, expectedKey: string): StateProofVerification {
  if (resp.key !== expectedKey) return { ok: false, reason: `response key '${resp.key}' != expected '${expectedKey}'` };
  return verifyMptInclusion(String(resp.mptRoot), expectedKey, resp.record, resp.proof as MptInclusionProof);
}

/**
 * Verify an ABSENCE state-proof response for a committed key — the nullifier-unspent shape
 * (`protocol-nullifier-set.md` Phase B): the response carries NO record, only a sealed
 * `Absence` proof that nothing is committed at `key` under `mptRoot`.
 *
 * The parameter is a structural subset of {@link StateProof} (`key`/`mptRoot`/`proof`), so it
 * accepts the chain's eventual absence response as-is once `/v1/nullifiers/{domain}/{nf}`
 * serves proofs for unspent nullifiers (today the route 404s on unspent — metakit rc.8 gates
 * the chain side). As with {@link verifyStateProof}, the caller supplies the key it EXPECTS
 * (e.g. `nullifier/<domain>/<nf>`) so a proof about some other key cannot be substituted.
 */
export function verifyAbsenceProof(
  resp: Pick<StateProof, 'key' | 'mptRoot' | 'proof'>,
  expectedKey: string,
): StateProofVerification {
  if (resp.key !== expectedKey) return { ok: false, reason: `response key '${resp.key}' != expected '${expectedKey}'` };
  const proof = resp.proof as MptProof;
  if (proof?.type !== 'Absence')
    return { ok: false, reason: `proof is not tagged 'Absence' (got '${String(proof?.type)}')` };
  return verifyMptAbsence(String(resp.mptRoot), expectedKey, proof);
}
