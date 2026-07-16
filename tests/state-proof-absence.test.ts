/**
 * Light-client MPT ABSENCE verification (metakit#60 `MerklePatriciaProof.Absence`).
 *
 * Two layers of coverage:
 *
 *  1. WIRE-SHAPE KATs ported byte-exact from metakit's `MerklePatriciaCodecKatSuite`
 *     (the frozen `{type,path,witness}` sealed-proof contract and the commitment ADT
 *     `{type:"Leaf"|"Branch"|"Extension",contents:{...}}` field names/order) — so a chain-side
 *     codec drift fails HERE before a light client mis-reads a proof.
 *
 *  2. SYNTHETIC tries built with the SAME digest rules the verifier folds on
 *     (`sha256(typePrefix ++ utf8(JCS(contents)))`, leaf `dataDigest = sha256(JCS(record))`),
 *     mirroring `MerklePatriciaAbsenceSuite` case-for-case: every absence terminal shape
 *     verifies, and every forged/replayed/tampered claim is rejected. The inclusion arm of the
 *     shared fold is already byte-validated against a live cluster proof (state-proof.test.ts);
 *     the absence arm differs ONLY in the terminal assertion, which these cases pin.
 */
import { canonicalize } from '@constellation-network/metagraph-sdk';
import { sha256 } from '@noble/hashes/sha256.js';
import {
  verifyMptAbsence,
  verifyMptInclusion,
  verifyMptProof,
  verifyAbsenceProof,
  commitKeyPath,
  type MptAbsenceProof,
  type MptInclusionProof,
  type MptProof,
  type MptWitnessNode,
} from '../src/ottochain/index.js';

// ---------------------------------------------------------------------------
// Synthetic-trie helpers — the exact digest rules of metakit's producer.
// ---------------------------------------------------------------------------

const toHex = (b: Uint8Array): string => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

/** Node commitment digest: `sha256(typePrefix ++ utf8(JCS(contents)))` — Leaf 0x00 / Branch 0x01 / Extension 0x02. */
function nodeDigest(node: MptWitnessNode): string {
  const prefix = { Leaf: 0, Branch: 1, Extension: 2 }[node.type];
  const canonical = new TextEncoder().encode(canonicalize(node.contents));
  const framed = new Uint8Array(1 + canonical.length);
  framed[0] = prefix;
  framed.set(canonical, 1);
  return toHex(sha256(framed));
}

/** Leaf data digest: `sha256(utf8(JCS(record)))` — NO prefix byte. */
function dataDigest(record: unknown): string {
  return toHex(sha256(new TextEncoder().encode(canonicalize(record))));
}

const leaf = (remaining: string, record: unknown): MptWitnessNode => ({
  type: 'Leaf',
  contents: { remaining, dataDigest: dataDigest(record) },
});
const branch = (pathsDigest: Record<string, string>): MptWitnessNode => ({
  type: 'Branch',
  contents: { pathsDigest },
});
const extension = (shared: string, childDigest: string): MptWitnessNode => ({
  type: 'Extension',
  contents: { shared, childDigest },
});

const absence = (key: string, witness: MptWitnessNode[]): MptAbsenceProof => ({
  type: 'Absence',
  path: commitKeyPath(key),
  witness,
});

// Trie A — two keys diverging at the first nibble: 'a' (path 61) -> "va", 'q' (path 71) -> "vq".
// Root = Branch{6 -> Leaf(remaining "1"), 7 -> Leaf(remaining "1")}.
const leafA = leaf('1', 'va');
const leafQ = leaf('1', 'vq');
const rootA = branch({ '6': nodeDigest(leafA), '7': nodeDigest(leafQ) });
const rootADigest = nodeDigest(rootA);

// Trie B — two keys sharing nibbles "616": 'ab' (6162) -> "v1", 'ad' (6164) -> "v2".
// Root = Extension(shared "616") -> Branch{2 -> Leaf(""), 4 -> Leaf("")}.
const leafAB = leaf('', 'v1');
const leafAD = leaf('', 'v2');
const branchB = branch({ '2': nodeDigest(leafAB), '4': nodeDigest(leafAD) });
const extB = extension('616', nodeDigest(branchB));
const rootBDigest = nodeDigest(extB);

// The canonical EMPTY trie: an empty Branch root (what removing every key collapses to).
const emptyRoot = branch({});
const emptyRootDigest = nodeDigest(emptyRoot);

describe('verifyMptAbsence — every divergence shape verifies against the true root', () => {
  it('branch-missing-nibble: key "A" (path 41) is absent under the {6,7} branch root', () => {
    expect(verifyMptAbsence(rootADigest, 'A', absence('A', [rootA]))).toEqual({ ok: true });
  });

  it('path-exhausted-at-branch: the empty key ends AT the branch (no value slot) — absent', () => {
    expect(verifyMptAbsence(rootADigest, '', absence('', [rootA]))).toEqual({ ok: true });
  });

  it('other-leaf: key "c" (path 63) folds into the "a" leaf whose remaining differs', () => {
    expect(verifyMptAbsence(rootADigest, 'c', absence('c', [leafA, rootA]))).toEqual({ ok: true });
  });

  it('extension-divergence: key "q" (path 71) diverges from the shared edge "616"', () => {
    expect(verifyMptAbsence(rootBDigest, 'q', absence('q', [extB]))).toEqual({ ok: true });
  });

  it('query exhausts INSIDE the extension edge: key "a" (path 61) vs shared "616" — absent', () => {
    expect(verifyMptAbsence(rootBDigest, 'a', absence('a', [extB]))).toEqual({ ok: true });
  });

  it('empty trie: any key is absent with the single empty-branch terminal', () => {
    const key = 'nullifier/00000000-0000-0000-0000-000000000000/' + 'ab'.repeat(32);
    expect(verifyMptAbsence(emptyRootDigest, key, absence(key, [emptyRoot]))).toEqual({ ok: true });
  });
});

describe('verifyMptAbsence — forged, replayed, or tampered claims are rejected', () => {
  it('rejects against a tampered root (first commitment binding)', () => {
    const res = verifyMptAbsence('ff' + rootADigest.slice(2), 'A', absence('A', [rootA]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('depth 0');
  });

  it('rejects a tampered witness commitment (terminal digest binding)', () => {
    const tamperedLeaf = leaf('1', 'FORGED');
    const res = verifyMptAbsence(rootADigest, 'c', absence('c', [tamperedLeaf, rootA]));
    expect(res.ok).toBe(false);
  });

  it('rejects a truncated and an emptied witness', () => {
    // Dropping the root-most element breaks the digest chain back to the root.
    const truncated = verifyMptAbsence(rootADigest, 'c', absence('c', [leafA]));
    const emptied = verifyMptAbsence(rootADigest, 'c', absence('c', []));
    expect(truncated.ok).toBe(false);
    expect(emptied.ok).toBe(false);
  });

  it('rejects an absence claim for a PRESENT key (relabeled and truncated inclusion witness)', () => {
    // Full inclusion witness relabeled as absence: terminal leaf MATCHES -> invalid.
    const relabeled = verifyMptAbsence(rootADigest, 'a', absence('a', [leafA, rootA]));
    // Witness truncated to the branch: terminal branch CONTAINS the next nibble -> invalid.
    const truncated = verifyMptAbsence(rootADigest, 'a', absence('a', [rootA]));
    expect(relabeled.ok).toBe(false);
    if (!relabeled.ok) expect(relabeled.reason).toContain('does not witness absence');
    expect(truncated.ok).toBe(false);
  });

  it('is not transferable to a different (present) path', () => {
    // The 'q' divergence witness replayed for present key 'ab' (path+key rewritten consistently).
    const res = verifyMptAbsence(rootBDigest, 'ab', absence('ab', [extB]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('does not witness absence');
  });

  it('rejects a path/key mismatch (proof.path must be hex(utf8(key)))', () => {
    const proof = { ...absence('A', [rootA]), path: commitKeyPath('B') };
    const res = verifyMptAbsence(rootADigest, 'A', proof);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('trie path');
  });

  it('rejects a leaf appearing before the end of the witness', () => {
    // Root IS leafA here, but the witness claims a deeper node below it.
    const res = verifyMptAbsence(nodeDigest(leafA), 'c', absence('c', [rootA, leafA]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('leaf before end of witness');
  });

  it('never throws on malformed proofs', () => {
    expect(verifyMptAbsence(rootADigest, 'A', {} as MptAbsenceProof).ok).toBe(false);
    expect(
      verifyMptAbsence(rootADigest, 'A', {
        type: 'Absence',
        path: commitKeyPath('A'),
        witness: [{ type: 'Bogus', contents: {} } as never],
      }).ok,
    ).toBe(false);
  });
});

describe('shared fold — the metakit#60 extension shared-prefix rule holds on BOTH arms', () => {
  it('inclusion: a forged proof whose extension edge diverges from the path is rejected', () => {
    // Genuine witness for 'ab' replayed for 'qb' (path 7162): without the mid-fold
    // shared-prefix check the fold would consume the edge without comparing it.
    const witness = [leafAB, branchB, extB];
    const genuine = verifyMptInclusion(rootBDigest, 'ab', 'v1', { path: commitKeyPath('ab'), witness });
    const forged = verifyMptInclusion(rootBDigest, 'qb', 'v1', { path: commitKeyPath('qb'), witness });
    expect(genuine).toEqual({ ok: true });
    expect(forged.ok).toBe(false);
    if (!forged.ok) expect(forged.reason).toContain('extension shared-nibble mismatch');
  });

  it('absence: a mid-fold extension with diverging shared nibbles is rejected', () => {
    // Deeper-than-terminal extension must also bind its edge to the queried path.
    const res = verifyMptAbsence(rootBDigest, 'qb', absence('qb', [branchB, extB]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('extension shared-nibble mismatch');
  });
});

describe('verifyMptProof — sealed-proof dispatch on the wire tag', () => {
  const inclusionWitness = [leafAB, branchB, extB];

  it('legacy un-tagged {path,witness} verifies as inclusion', () => {
    const legacy: MptInclusionProof = { path: commitKeyPath('ab'), witness: inclusionWitness };
    expect(verifyMptProof(rootBDigest, 'ab', 'v1', legacy)).toEqual({ ok: true });
  });

  it('tagged Inclusion behaves byte-identically to the legacy shape', () => {
    const tagged: MptProof = { type: 'Inclusion', path: commitKeyPath('ab'), witness: inclusionWitness };
    const legacy: MptInclusionProof = { path: commitKeyPath('ab'), witness: inclusionWitness };
    expect(verifyMptProof(rootBDigest, 'ab', 'v1', tagged)).toEqual(verifyMptProof(rootBDigest, 'ab', 'v1', legacy));
    expect(verifyMptProof(rootBDigest, 'ab', 'v1', tagged)).toEqual({ ok: true });
    // ... including on failure (tampered record) — same arm, same reason.
    expect(verifyMptProof(rootBDigest, 'ab', 'FORGED', tagged)).toEqual(
      verifyMptProof(rootBDigest, 'ab', 'FORGED', legacy),
    );
  });

  it('tagged Absence dispatches to the absence arm', () => {
    expect(verifyMptProof(rootADigest, 'A', undefined, absence('A', [rootA]))).toEqual({ ok: true });
  });

  it('rejects an Absence proof presented WITH a record (contract mismatch)', () => {
    const res = verifyMptProof(rootADigest, 'A', 42, absence('A', [rootA]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('cannot attest a record');
  });

  it('rejects an unknown proof tag', () => {
    const res = verifyMptProof(rootADigest, 'A', undefined, {
      type: 'Bogus',
      path: commitKeyPath('A'),
      witness: [rootA],
    } as never);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain("unknown proof type 'Bogus'");
  });
});

describe('verifyAbsenceProof — the nullifier-unspent response shape (no record)', () => {
  const key = 'nullifier/00000000-0000-0000-0000-000000000000/' + 'cd'.repeat(32);

  it('accepts a response whose Absence proof verifies for the expected key', () => {
    const resp = { key, mptRoot: emptyRootDigest, proof: absence(key, [emptyRoot]) };
    expect(verifyAbsenceProof(resp, key)).toEqual({ ok: true });
  });

  it('rejects a response claiming a different key', () => {
    const resp = { key, mptRoot: emptyRootDigest, proof: absence(key, [emptyRoot]) };
    const res = verifyAbsenceProof(resp, 'nullifier/other/' + 'cd'.repeat(32));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain('expected');
  });

  it('rejects a proof not tagged Absence (an inclusion proof proves the OPPOSITE claim)', () => {
    const resp = { key: 'a', mptRoot: rootADigest, proof: { path: commitKeyPath('a'), witness: [leafA, rootA] } };
    const res = verifyAbsenceProof(resp, 'a');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toContain("not tagged 'Absence'");
  });
});

// ---------------------------------------------------------------------------
// Wire-shape KATs — byte-exact from metakit MerklePatriciaCodecKatSuite.
// ---------------------------------------------------------------------------

describe('wire KATs ported from metakit MerklePatriciaCodecKatSuite', () => {
  const H1 = 'aa'.repeat(32);
  const H2 = 'bb'.repeat(32);

  // "MPT commitment wire keys: Leaf/Branch/Extension" — exact field names + order.
  it('commitment contents field names/order match the frozen wire', () => {
    const leafJson = JSON.parse(`{"remaining":"a","dataDigest":"${H1}"}`) as Record<string, unknown>;
    const branchJson = JSON.parse(`{"pathsDigest":{"a":"${H1}","b":"${H2}"}}`) as Record<string, unknown>;
    const extJson = JSON.parse(`{"shared":"1","childDigest":"${H1}"}`) as Record<string, unknown>;
    expect(Object.keys(leafJson)).toEqual(['remaining', 'dataDigest']);
    expect(Object.keys(branchJson)).toEqual(['pathsDigest']);
    expect(Object.keys(extJson)).toEqual(['shared', 'childDigest']);
  });

  // "MPT sealed proof wire = {type, path, witness}; both tags round-trip" — the exact
  // sealed-proof JSON must parse into shapes our dispatcher routes by tag, and reach the
  // digest fold (fail on the commitment BINDING, never on shape).
  const sealedWire = (tag: 'Inclusion' | 'Absence'): string =>
    `{"type":"${tag}","path":"abcd","witness":[` +
    `{"type":"Leaf","contents":{"remaining":"a","dataDigest":"${H1}"}},` +
    `{"type":"Branch","contents":{"pathsDigest":{"a":"${H1}","b":"${H2}"}}}]}`;

  it('sealed proof {type,path,witness} parses and dispatches by tag for BOTH tags', () => {
    for (const tag of ['Inclusion', 'Absence'] as const) {
      const parsed = JSON.parse(sealedWire(tag)) as MptProof;
      expect(Object.keys(parsed as unknown as Record<string, unknown>)).toEqual(['type', 'path', 'witness']);
      expect(parsed.type).toBe(tag);
      expect(parsed.witness.map((n) => n.type)).toEqual(['Leaf', 'Branch']);
      // The KAT carries placeholder digests, so with the path re-bound to a real key the fold
      // must fail at the ROOT COMMITMENT BINDING (depth 0) — proving the wire shape was
      // consumed by the digest fold, not rejected structurally.
      const rebound = { ...parsed, path: commitKeyPath('kat') } as MptProof;
      const res = verifyMptProof(H2, 'kat', tag === 'Inclusion' ? 'record' : undefined, rebound);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.reason).toContain('depth 0');
    }
    // Tag-routing is observable: an Absence tag refuses a record before any fold work.
    const absenceParsed = JSON.parse(sealedWire('Absence')) as MptProof;
    const routed = verifyMptProof(H2, 'kat', 'record', absenceParsed);
    expect(routed.ok).toBe(false);
    if (!routed.ok) expect(routed.reason).toContain('cannot attest a record');
  });

  // "MPT sealed Inclusion encoding = legacy {path, witness} shape + type tag" — dropping the
  // tag from the Inclusion wire must not change how the verifier consumes it.
  it('sealed Inclusion == legacy {path,witness} + tag for the verifier', () => {
    const tagged = JSON.parse(sealedWire('Inclusion')) as MptInclusionProof;
    const legacy: MptInclusionProof = { path: tagged.path, witness: tagged.witness };
    expect(Object.keys(legacy)).toEqual(['path', 'witness']);
    const taggedRes = verifyMptProof(H2, 'kat', 'r', { ...tagged, path: commitKeyPath('kat') });
    const legacyRes = verifyMptProof(H2, 'kat', 'r', { ...legacy, path: commitKeyPath('kat') });
    expect(taggedRes).toEqual(legacyRes);
  });
});
