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
 *  - the response `witness` is LEAF-FIRST; verification walks it reversed (root-first);
 *  - every node's digest = `sha256(typePrefix ++ utf8(JCS(dropNulls(contents))))` over the
 *    commitment's SUBTYPE (contents-only) encoding — prefixes: leaf `0x00`, branch `0x01`,
 *    extension `0x02`;
 *  - a Branch consumes one path nibble via `pathsDigest`; an Extension consumes its `shared`
 *    nibbles and continues at `childDigest`;
 *  - the terminal Leaf must match the remaining path (`remaining`) and bind
 *    `dataDigest == sha256(JCS(dropNulls(record)))` (no prefix);
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

/** One commitment node of a Merkle-Patricia inclusion witness (wire form, leaf-first). */
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
  /** Trie path = hex(utf8(committed key)). */
  path: string;
  witness: MptWitnessNode[];
}

/** Verification outcome: `ok`, or the first failed binding with a human-readable reason. */
export type StateProofVerification = { ok: true } | { ok: false; reason: string };

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

const toHexStr = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

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

/**
 * Verify a Merkle-Patricia inclusion proof: `record` is committed at `key` under `mptRoot`.
 *
 * Pure and side-effect free; never throws on malformed input (returns `{ ok: false }`).
 */
export function verifyMptInclusion(
  mptRoot: string,
  key: string,
  record: unknown,
  proof: MptInclusionProof
): StateProofVerification {
  const fail = (reason: string): StateProofVerification => ({ ok: false, reason });
  if (!proof || typeof proof.path !== 'string' || !Array.isArray(proof.witness) || proof.witness.length === 0)
    return fail('malformed proof (missing path/witness)');

  const expectedPath = commitKeyPath(key);
  if (proof.path.toLowerCase() !== expectedPath) return fail(`trie path != hex(utf8("${key}"))`);

  let digest = String(mptRoot).replace(/^0x/, '').toLowerCase();
  let path = proof.path.toLowerCase();
  const nodes = [...proof.witness].reverse(); // response is leaf-first; fold root-first

  for (const [depth, node] of nodes.entries()) {
    const isLast = depth === nodes.length - 1;
    const prefix = NODE_PREFIX[node?.type as MptWitnessNode['type']];
    if (prefix === undefined) return fail(`unknown witness node type '${String(node?.type)}'`);
    if (jcsSha256(node.contents, prefix) !== digest)
      return fail(`${node.type.toLowerCase()} commitment mismatch at depth ${depth}`);

    if (node.type === 'Branch') {
      const child = node.contents.pathsDigest?.[path[0]];
      if (!child) return fail(`branch has no child at nibble '${path[0]}' (depth ${depth})`);
      digest = child.toLowerCase();
      path = path.slice(1);
    } else if (node.type === 'Extension') {
      const shared = String(node.contents.shared ?? '');
      if (!path.startsWith(shared.toLowerCase())) return fail(`extension shared-nibble mismatch at depth ${depth}`);
      path = path.slice(shared.length);
      digest = String(node.contents.childDigest ?? '').toLowerCase();
    } else {
      // Leaf
      if (!isLast) return fail('leaf before end of witness');
      if (String(node.contents.remaining ?? '').toLowerCase() !== path) return fail('leaf remaining-path mismatch');
      if (String(node.contents.dataDigest ?? '').toLowerCase() !== jcsSha256(record))
        return fail('leaf dataDigest != sha256(JCS(record))');
      return { ok: true };
    }
  }
  return fail('witness does not terminate in a leaf');
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
  if (resp.key !== expectedKey)
    return { ok: false, reason: `response key '${resp.key}' != expected '${expectedKey}'` };
  return verifyMptInclusion(String(resp.mptRoot), expectedKey, resp.record, resp.proof as MptInclusionProof);
}
